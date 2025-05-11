/** @type {{form: HTMLFormElement, fieldset: HTMLFieldSetElement, initializer: ()=>void}[]} */
const forms = [
    {
        form: document.getElementById("class-name"),
        fieldset: document.getElementById("class-name-form"),
        initializer: classNameFormInitializer
    }
];
const fieldSetDictionary = {
    className: document.getElementById("class-name-form")
}

let USER_ID = "";
let API_URL = "";

/**
 * 現在の通信数
 */
let loadCount = 0;

/**
 * @type {changeData}
 */
let changesData = [];
let changingDataCount = 0;
let changingLoadCount = 0;


function startLoad() {
    loadCount++;
    document.getElementById("load").textContent = "同期中";
}
function finishLoad() {
    loadCount--;
    if (loadCount <= 0) {
        document.getElementById("load").textContent = "";
    }
}
function failLoad() {
    loadCount--;
    document.getElementById("load").textContent = "同期失敗";
}

/**
 * 変更を追加する関数
 * @param  {...(scheduleChangeData | contentChangeData | userChangeData | classesChangeData | schoolChangeData | settingsChangeData)} changes - 変更
 */
function addChanges(...changes) {
    changesData.push(...changes);
    setChanges();
}
/**
 * 変更を適用してデータを取得
 */
async function setChanges() {
    if (changingLoadCount <= 0 && changesData.length > 0) {
        const url = new URL(API_URL);
        url.searchParams.set("id", USER_ID);
        startLoad();
        changingLoadCount++;
        try {
            changingDataCount = changesData.length;
            const response = await fetch(url, {method: "POST", body: JSON.stringify(changesData)});
            if (response.ok) {
                const responseText = await response.text();
                localStorage.setItem("school-schedule_data", responseText);
                const responseData = JSON.parse(responseText);
                if (!responseData.error) {
                    data = responseData;
                    updateForms();
                    changesData.splice(0, changingDataCount);
                    finishLoad();
                    setTimeout(setChanges, 500);
                } else {
                    if (responseData.message == "INVALID_USER_ID") {
                        showFirstDialog("ユーザーidが誤っています。");
                        finishLoad();
                    } else if (responseData.message == "CHANGES_NOT_SAVED") {
                        setTimeout(setChanges, 3000);
                        failLoad();
                    }
                }
                changingLoadCount--;
            } else {
                failLoad();
                changingLoadCount--;
                if (!data) showFirstDialog("データの取得に失敗しました。URLが正しいか確認してください。");
            }
        } catch(error) {
            failLoad();
            changingLoadCount--;
            console.error(error);
            if (!data) showFirstDialog("データの取得に失敗しました。ネットワーク接続を確認し、URLが正しいか確認してください。");
        }
    }
}

try {
    USER_ID = localStorage.getItem("school-schedule_userId");
    API_URL = localStorage.getItem("school-schedule_URL");
    data = JSON.parse(localStorage.getItem("school-schedule_data"));
} catch (error) {
    console.error(error);
}
/**
 * ユーザーid及びURLを求めるダイアログを表示
 * @param {string} [message="ユーザーidとURLを入力してください。"] - ダイアログに表示するメッセージ
 */
function showFirstDialog(message = "ユーザーidとURLを入力してください。") {
    document.getElementById("firstDialogMessage").textContent = message;
    document.getElementById("userId-input").value = USER_ID;
    document.getElementById("API-input").value = API_URL;
    document.getElementById("firstForm").addEventListener("submit", event => {
        USER_ID = document.getElementById("userId-input").value;
        API_URL = document.getElementById("API-input").value;
        if (!USER_ID || !API_URL) {
            document.getElementById("firstDialog").addEventListener("close", event => {
                showFirstDialog("!値を入力してください。");
            }, {once: true});
        } else {
            try {
                localStorage.setItem("school-schedule_userId", USER_ID);
                localStorage.setItem("school-schedule_URL", API_URL);
            } catch (error) {
                console.error(error);
            }
            getDataAndUpdate();
        }
    }, {once: true});
    document.getElementById("firstDialog").showModal();
}
document.getElementById("firstDialog").addEventListener("close", event => {
    if (!USER_ID || !API_URL) showFirstDialog("!値を入力してください。");
});

/**
 * 学年及びクラスを求めるダイアログを表示
 * @param {string} [message="あなたのクラスを入力してください。"] - ダイアログに表示するメッセージ
 */
function showClassDialog(message = "あなたのクラスを入力してください。") {
    document.getElementById("classDialogMessage").textContent = message;
    document.getElementById("userId-input").value = USER_ID;
    document.getElementById("API-input").value = API_URL;
    document.getElementById("firstForm").addEventListener("submit", event => {
        USER_ID = document.getElementById("userId-input").value;
        API_URL = document.getElementById("API-input").value;
        if (!USER_ID || !API_URL) {
            document.getElementById("firstDialog").addEventListener("close", event => {
                showFirstDialog("!値を入力してください。");
            }, {once: true});
        } else {
            try {
                localStorage.setItem("school-schedule_userId", USER_ID);
                localStorage.setItem("school-schedule_URL", API_URL);
            } catch (error) {
                console.error(error);
            }
            getDataAndUpdate();
        }
    }, {once: true});
    document.getElementById("firstDialog").showModal();
}
document.getElementById("firstDialog").addEventListener("close", event => {
    if (!USER_ID || !API_URL) showFirstDialog("!値を入力してください。");
});

if (!USER_ID || !API_URL) {
    showFirstDialog();
} else {
    getDataAndUpdate();
}

/**
 * データを取得
 * @param {(data:schoolScheduleData)} [callback] - データを取得した後に実行する関数
 */
async function getData(callback) {
    const url = new URL(API_URL);
    url.searchParams.set("id", USER_ID);
    startLoad();
    try {
        const response = await fetch(url, {method: "GET"});
        if (response.ok) {
            const responseText = await response.text();
            localStorage.setItem("school-schedule_data", responseText);
            const responseData = JSON.parse(responseText);
            if (callback) callback(responseData);
            finishLoad();
        } else {
            failLoad();
            if (!data) showFirstDialog("データの取得に失敗しました。URLが正しいか確認してください。");
        }
    } catch(error) {
        failLoad();
        console.error(error);
        if (!data) showFirstDialog("データの取得に失敗しました。ネットワーク接続を確認し、URLが正しいか確認してください。");
    }
}
/**
 * データを取得し全てのフォームを初期化
 */
function getDataAndUpdate() {
    getData(responseData => {
        if (!responseData.error) {
            let existData = true;
            if (!data) existData = false;
            data = responseData;
            if (existData) initializeAllForms();
        } else {
            if (responseData.message == "INVALID_USER_ID") {
                showFirstDialog("ユーザーidが誤っています。");
            }
        }
    });
}

function initializeAllForms() {
    for (let formObject of forms) {
        formObject.initializer();
    }
}
if (data) initializeAllForms();

/**
 * 更新が必要とされるフォームのみ更新
 */
function updateForms() {
    for (let formObject of forms) {
        if (formObject.fieldset.disabled) {
            formObject.initializer();
            formObject.fieldset.disabled = false;
        }
    }
}


function classNameFormInitializer() {}
document.getElementById("class-name").addEventListener("submit", event => {
    return false;
});