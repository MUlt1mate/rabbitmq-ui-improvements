let formatter = new Formatter();

function Formatter() {
    this.payload = document.getElementsByTagName('textarea')[0];

    this.parseError = document.createElement("div");
    this.parseError.id = 'parseError';

    this.formattedDiv = document.createElement("div");
    this.formattedDiv.id = 'formattedPayload';

    this.beautifyLink = document.createElement('a');
    this.beautifyLink.id = 'beautifyPayload';
    this.beautifyLink.className = 'payloadBtn';
    this.beautifyLink.innerText = 'Beautify';
    this.beautifyLink.onclick = function () {
        formatter.beautify();
    };

    this.minifyLink = document.createElement('a');
    this.minifyLink.id = 'minifyPayload';
    this.minifyLink.className = 'payloadBtn';
    this.minifyLink.innerText = 'Minify';
    this.minifyLink.onclick = function () {
        formatter.minify();
    };

    // parses new text from payload
    this.update = function () {
        this.formattedDiv.innerHTML = '';
        this.hideError();
        let raw = this.payload.value;
        if ('' === raw) {
            return false;
        }

        let jsonObj;
        try {
            jsonObj = JSON.parse(raw);
        }
        catch (e) {
            this.showError(e.toString());
            return false;
        }

        let formatter = new JSONFormatter(jsonObj, Infinity, {
            hoverPreviewEnabled: false,
            hoverPreviewArrayCount: 20,
            hoverPreviewFieldCount: 20,
            animateOpen: true,
            animateClose: true,
            useToJSON: true
        });
        this.formattedDiv.appendChild(formatter.render());
        return true;
    };

    this.showError = function (error) {
        this.parseError.innerText = error;
    };

    this.hideError = function () {
        this.parseError.innerText = '';
    };

    this.beautify = function () {
        let jsonObj;
        try {
            jsonObj = JSON.parse(this.payload.value);
        }
        catch (e) {
            this.showError(e.toString());
            return;
        }
        this.payload.value = JSON.stringify(jsonObj, undefined, 2);
    };

    this.minify = function () {
        let jsonObj;
        try {
            jsonObj = JSON.parse(this.payload.value);
        }
        catch (e) {
            this.showError(e.toString());
            return;
        }
        this.payload.value = JSON.stringify(jsonObj);
    }
}

let hash = document.location.hash;
setInterval(checkPageChange, 500);

function checkPageChange() {
    let newHash = document.location.hash;
    if (hash !== newHash) {
        init();
        hash = newHash;
    }
}

// we wait a bit for payload element to init
setTimeout(init, 300);

async function init() {
    formatter = new Formatter();
    if (formatter.payload === undefined || formatter.payload === undefined) {
        return;
    }

    formatter.payload.parentElement.append(formatter.parseError);
    formatter.payload.closest('div').append(formatter.formattedDiv);
    let btnPlace = formatter.payload.closest('tr').children[0];
    btnPlace.append(formatter.beautifyLink);
    btnPlace.append(document.createElement('br'));
    btnPlace.append(formatter.minifyLink);
    formatter.update();
    let wait = null;
    formatter.payload.onkeyup = function () {
        window.clearTimeout(wait);
        wait = setTimeout(function () {
            if (formatter.update()) {
                savePayload(formatter.payload.value);
            }
        }, 700);
    };
    getSavedPayload(function (result) {
        let value = result[getKey()];
        if (!value) {
            return;
        }
        formatter.payload.value = value;
        formatter.update();
    })
}

// generate key for current queue and host
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