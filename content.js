function Formatter() {
    this.parseError = document.createElement("div");
    this.parseError.id = 'parseError';
    this.formattedDiv = document.createElement("div");
    this.formattedDiv.id = 'formattedPayload';
    this.payload = document.getElementsByTagName('textarea')[0];
    this.update = function () {
        console.log('updated!!');
        this.formattedDiv.innerHTML = '';
        this.hideError();
        let raw = this.payload.value;
        if ('' === raw) {
            return;
        }

        let jsonObj;
        try {
            jsonObj = JSON.parse(raw);
        }
        catch (e) {
            this.showError(e.toString());
            return;
        }

        // this.payload.value = JSON.stringify(jsonObj, undefined, 2);

        savePayload(this.payload.value);

        let formatter = new JSONFormatter(jsonObj, Infinity, {
            hoverPreviewEnabled: false,
            hoverPreviewArrayCount: 20,
            hoverPreviewFieldCount: 20,
            theme: 'dark',
            animateOpen: true,
            animateClose: true,
            useToJSON: true
        });
        this.formattedDiv.appendChild(formatter.render());
    };
    this.showError = function (error) {
        this.parseError.innerText = error;
    };

    this.hideError = function () {
        this.parseError.innerText = '';
    };
}

let hash = document.location.hash;
setInterval(updateHash, 500);

function updateHash() {
    let newHash = document.location.hash;
    console.log(newHash);
    if (hash !== newHash) {
        init();
        hash = newHash;
    }
}

init();

function init() {
    let formatter = new Formatter();
    if (formatter.payload === undefined || formatter.payload === undefined) {
        return;
    }

    formatter.payload.parentElement.append(formatter.parseError);
    formatter.payload.closest('div').append(formatter.formattedDiv);
    formatter.update();
    let wait = null;
    formatter.payload.onkeyup = function () {
        window.clearTimeout(wait);
        wait = setTimeout(function () {
            formatter.update();
        }, 700);
    };
    getSavedPayload(function (result) {
        let key = getKey();
        if (!key) {
            return;
        }
        let value = result[key];
        if (!value) {
            return;
        }
        formatter.payload.value = value;
        formatter.update();
    })
}


function getKey() {
    const queueExp = /\/queues\/%2F\/(.*)/;

    let found = window.location.hash.match(queueExp);
    if (null === found) {
        return found;
    }
    return 'rmq_q_payload_' + window.location.hostname + found[1];
}

function savePayload(payload) {
    let key = getKey();
    if (!key) {
        return;
    }
    let obj = {};
    obj[key] = payload;
    chrome.storage.local.set(obj);
}

function getSavedPayload(callback) {
    let key = getKey();
    if (!key) {
        return;
    }
    chrome.storage.local.get([key], callback);
}