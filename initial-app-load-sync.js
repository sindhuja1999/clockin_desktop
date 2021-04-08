function mysync() {

    const options = {
        headers: { 'Authorization': 'Bearer ' + localStorage.token }
    };
    axios.get('https://gwaas-b7mbepvdgi.us3.hana.ondemand.com/odata/sap/HCMFAB_MYTIMEEVENTS_SRV/TimeEventSet', options).then((resp) => {
        let myarr = resp.data.d.results
        // console.log(myarr)
        for (let i = 0; i < myarr.length; i++) {
            if (myarr[i].StatusText === 'Approved') {
                let employeeId = myarr[i].EmployeeID
                let eventDate = myarr[i].EventDate
                let eventTime = myarr[i].EventTime
                let query = { module: 'TimeEventSetIndividual', EmployeeID: employeeId, EventDate: eventDate, EventTime: eventTime }
                db.findOne(query, function (err, data) {
                    if (err) {
                        console.log("Error in identifying the time event set individual records", err)
                    } else if (!data) {
                        db.insert({ module: 'TimeEventSetIndividual', isSynced: true, isPosted: false, ...myarr[i] }, function (err, entities) {
                            if (err) {
                                console.log('Error in inserting data', err)
                            }
                        });
                    }
                })
            }

            if (myarr[i].StatusText === 'Posted') {
                let employeeId = myarr[i].EmployeeID
                let eventDate = myarr[i].EventDate
                let statusText = myarr[i].StatusText
                let status = myarr[i].Status
                let reqId = myarr[i].ReqId
                let eventTime = myarr[i].EventTime
                let query = { module: 'TimeEventSetIndividual', EmployeeID: employeeId, EventDate: eventDate, EventTime: eventTime }
                db.findOne(query, function (err, data) {
                    if (err) {
                        console.log('Error in Finding the Individual record', err)
                    }
                    else if (data) {
                        if (!data.isPosted) {
                            db.update({ module: 'TimeEventSetIndividual', EmployeeID: employeeId, EventDate: eventDate, isPosted: false }, { $set: { StatusText: statusText, Status: status, ReqId: reqId } }, {}, function (err, numReplaced) {
                                if (err) {
                                    console.log("Error in Updating the documents during sync process", err)
                                }
                            })
                        }
                    } else if (!data) {
                        db.insert({ module: 'TimeEventSetIndividual', isSynced: true, isPosted: true, ...myarr[i] }, function (err, entities) {
                            if (err) {
                                console.log('Error in Inserting records to TimeEventSetIndividual module', err)
                            }
                        });
                    }
                })
            }
            if (myarr[i].Origin === 'M') {
                // console.log(myarr[i].ReqId, 'Req Id for M value')
                let modifiedRecordsQuery = { module: 'TimeEventSetIndividual', ReqId: myarr[i].ReqId }

                db.findOne(modifiedRecordsQuery, function (err, data) {
                    if (err) {
                        console.log('Error in finding the records', err)
                    }
                    else if (data) {
                        // console.log(data, 'Dataaaaaaaaa')
                        let updatedObject = { ...data, ...myarr[i] }
                        // console.log('updated object', updatedObject)
                        db.update(modifiedRecordsQuery, { $set: updatedObject }, function (err, updatedRecord) {
                            if (err) {
                                console.log('Error in Updating the records in replacement mode', err)
                            }
                            else if (updatedRecord) {
                                console.log('Updated Records', updatedRecord)
                            }
                        })
                    }
                })
            }
        }

        db.find({ module: 'TimeEventSetIndividual', StatusText: 'Posted' }, function (err, timeevents) {
            if (err) {
                console.log('Error in finding the timeevent set individual records', err)
            }
            else if (timeevents.length && myarr.length) {
                Array.prototype.diff = function (a) {
                    return this.filter(function (i) { return a.indexOf(i) < 0; });
                };
                let backendrecords = myarr.map((record) => {
                    if (record.ReqId) {
                        return record.ReqId
                    }
                })
                let localrecords = timeevents.map((events) => {
                    if (events.ReqId) {
                        return events.ReqId;
                    }
                })
                let recordsToDelete = localrecords.diff(backendrecords)
                if (recordsToDelete.length) {
                    recordsToDelete.map((record) => {
                        if (record) {
                            db.remove({ 'ReqId': record }, function (err, removedElementCount) {
                                if (err) {
                                    console.log('Error in removing the record from the local database', err)
                                }
                                else if (removedElementCount) {
                                    console.log('Removed Element Count', removedElementCount)
                                }
                            })
                        }
                    })
                }
            }
        })

    })

}