let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTrans();
    }
}

//this function will run when theres no internet connection when attempting a transaction
function saveRecord(record) {
    //open new transaction
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    //access the objectStore
    const budgetObjectStore = transaction.objectStore('new_transaction');
    //use add method to add record to objectStore
    budgetObjectStore.add(record);
}

function uploadTrans() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_transaction');

    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        //send any data stored in IndexedDb to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open a new transaction and clear the objectStore
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_transaction');
                    budgetObjectStore.clear();
                    alert('All saved data has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

//listen for app coming back online
window.addEventListener('online', uploadTrans);