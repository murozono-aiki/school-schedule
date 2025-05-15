/** @type {{form: HTMLFormElement, fieldset: HTMLFieldSetElement, initializer: ()=>void}[]} */
const forms = [
    {
        form: document.getElementById("class-name"),
        fieldset: document.getElementById("class-name-form"),
        initializer: classNameFormInitializer
    },
    {
        form: document.getElementById("table"),
        fieldset: document.getElementById("table-form"),
        initializer: tableFormInitializer
    }
];
/** @type {{[formName:string]:HTMLFieldSetElement}} */
const fieldSetDictionary = {
    className: document.getElementById("class-name-form"),
    table: document.getElementById("table-form")
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

for (let formObject of forms) {
    formObject.fieldset.disabled = true;
}


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
                    if (isValidScheduleData(responseData)) {
                        data = responseData;
                        updateForms();
                        changesData.splice(0, changingDataCount);
                        finishLoad();
                        setTimeout(setChanges, 500);
                    } else {
                        showFirstDialog("正しいデータが送られてきませんでした。URLが正しいか確認してください。");
                        finishLoad();
                    }
                } else {
                    if (responseData.message == "INVALID_USER_ID") {
                        showFirstDialog("ユーザーidが誤っています。");
                        finishLoad();
                    } else if (responseData.message == "CHANGES_NOT_SAVED") {
                        setTimeout(setChanges, 3000);
                        failLoad();
                    } else {
                        showFirstDialog("正しいデータが送られてきませんでした。URLが正しいか確認してください。");
                        finishLoad();
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

function classDialogInitializer() {
    let maxGrade = 1;
    let classNames = [];
    for (let className in data.classes) {
        const currentClassGrade = data.classes[className].grade;
        if (currentClassGrade > maxGrade) {
            maxGrade = currentClassGrade;
        }
        classNames.push(className);
    }
    classNames.sort((a, b) => {
        const gradeDifference = data.classes[a].grade - data.classes[b].grade;
        if (gradeDifference != 0) return gradeDifference;
        return a.localeCompare(b, 'ja');
    });

    const gradeSelect = document.getElementById("grade-select");
    while (gradeSelect.firstChild) {
        gradeSelect.removeChild(gradeSelect.firstChild);
    }
    for (let i = 1; i <= maxGrade; i++) {
        const gradeOptionElement = document.createElement("option");
        gradeSelect.appendChild(gradeOptionElement);
        gradeOptionElement.appendChild(document.createTextNode(i + "年"));
        gradeOptionElement.value = i.toString();
    }
    document.getElementById("grade-select-add").dataset.nextGrade = (maxGrade + 1).toString();
    document.getElementById("grade-select-add").textContent = (maxGrade + 1) + "年を追加";
    if (data.user[USER_ID].grade) {
        gradeSelect.value = data.user[USER_ID].grade.toString();
    } else if (classNames[0]) {
        gradeSelect.value = data.classes[classNames[0]].grade.toString();
    } else {
        gradeSelect.value = "1";
    }

    const classNamesSelect = document.getElementById("class-select");
    while (classNamesSelect.firstChild) {
        classNamesSelect.removeChild(classNamesSelect.firstChild);
    }
    for (let i = 0; i < classNames.length; i++) {
        const classOptionElement = document.createElement("option");
        classNamesSelect.appendChild(classOptionElement);
        classOptionElement.appendChild(document.createTextNode(classNames[i]));
        classOptionElement.value = classNames[i];
    }
    if (data.user[USER_ID].className) {
        classNamesSelect.value = data.user[USER_ID].className;
    } else {
        classNamesSelect.value = classNames[0];
    }
}
document.getElementById("grade-select-add").dataset.nextGrade = "1";
document.getElementById("grade-select-add").addEventListener("click", event => {
    const newGrade = parseInt(document.getElementById("grade-select-add").dataset.nextGrade);
    const newGradeOptionElement = document.createElement("option");
    document.getElementById("grade-select").appendChild(newGradeOptionElement);
    newGradeOptionElement.appendChild(document.createTextNode(newGrade + "年"));
    newGradeOptionElement.value = newGrade.toString();
    document.getElementById("grade-select").value = newGrade.toString();
    document.getElementById("grade-select").dispatchEvent(new Event("change"));
    document.getElementById("grade-select-add").dataset.nextGrade = (newGrade + 1).toString();
    document.getElementById("grade-select-add").textContent = (newGrade + 1) + "年を追加";
});
document.getElementById("class-checkbox").addEventListener("change", event => {
    if (document.getElementById("class-checkbox").checked) {
        document.getElementById("class-select-container").style.display = "none";
        document.getElementById("class-input-container").style.display = "";
    } else {
        document.getElementById("class-select-container").style.display = "";
        document.getElementById("class-input-container").style.display = "none";
    }
});
document.getElementById("class-checkbox").dispatchEvent(new Event("change"));
document.getElementById("class-select").addEventListener("change", event => {
    const value = document.getElementById("class-select").value;
    if (data.classes[value]) {
        document.getElementById("grade-select").value = data.classes[value].grade.toString();
    }
});
document.getElementById("class-input").addEventListener("change", event => {
    const value = document.getElementById("class-input").value;
    if (data.classes[value]) {
        document.getElementById("grade-select").value = data.classes[value].grade.toString();
    }
});
document.getElementById("classForm").addEventListener("submit", event => {
    let grade = parseInt(document.getElementById("grade-select").value);
    let className;
    if (!document.getElementById("class-checkbox").checked) {
        className = document.getElementById("class-select").value;
    } else {
        className = document.getElementById("class-input").value;
    }
    if (data.classes[className]) {
        grade = data.classes[className].grade;
    }
    addChanges({
        type: "user",
        key: {
            userId: USER_ID
        },
        changes: [
            {
                method: "edit",
                key: "grade",
                value: grade
            },
            {
                method: "edit",
                key: "className",
                value: className
            }
        ]
    });
});
/**
 * 学年及びクラスを求めるダイアログを表示
 * @param {string} [message="あなたのクラスを入力してください。"] - ダイアログに表示するメッセージ
 */
function showClassDialog(message = "あなたのクラスを入力してください。") {
    document.getElementById("classDialogMessage").textContent = message;
    classDialogInitializer();
    document.getElementById("classDialog").showModal();
}
document.getElementById("classDialog").addEventListener("close", event => {
    if (loadCount <= 0)  updateForms();
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
 * データを取得しフォームを初期化
 */
function getDataAndUpdate() {
    getData(responseData => {
        if (!responseData.error) {
            if (isValidScheduleData(responseData)) {
                let existData = true;
                if (!data) existData = false;
                data = responseData;
                if (existData) updateForms();
                else initializeAllForms();
            } else {
                showFirstDialog("正しいデータが送られてきませんでした。URLが正しいか確認してください。");
            }
        } else {
            if (responseData.message == "INVALID_USER_ID") {
                showFirstDialog("ユーザーidが誤っています。");
            }
        }
    });
}

function initializeAllForms() {
    if (!data.user[USER_ID].grade || !data.user[USER_ID].className) {
        showClassDialog();
    } else {
        for (let formObject of forms) {
            formObject.initializer();
            formObject.fieldset.disabled = false;
        }
    }
}

/**
 * 更新が必要とされるフォームのみ更新
 */
function updateForms() {
    if (!data.user[USER_ID].grade || !data.user[USER_ID].className) {
        showClassDialog();
    } else {
        for (let formObject of forms) {
            if (formObject.fieldset.disabled) {
                formObject.initializer();
                formObject.fieldset.disabled = false;
            }
        }
    }
}


// 学年・クラス
function classNameFormInitializer() {
    let maxGrade = 1;
    let classNames = [];
    for (let className in data.classes) {
        const currentClassGrade = data.classes[className].grade;
        if (currentClassGrade > maxGrade) {
            maxGrade = currentClassGrade;
        }
        classNames.push(className);
    }
    classNames.sort((a, b) => {
        const gradeDifference = data.classes[a].grade - data.classes[b].grade;
        if (gradeDifference != 0) return gradeDifference;
        return a.localeCompare(b, 'ja');
    });

    const gradeSelect = document.getElementById("class-name-grade");
    while (gradeSelect.firstChild) {
        gradeSelect.removeChild(gradeSelect.firstChild);
    }
    for (let i = 1; i <= maxGrade; i++) {
        const gradeOptionElement = document.createElement("option");
        gradeSelect.appendChild(gradeOptionElement);
        gradeOptionElement.appendChild(document.createTextNode(i + "年"));
        gradeOptionElement.value = i.toString();
    }
    document.getElementById("class-name-grade-add").dataset.nextGrade = (maxGrade + 1).toString();
    document.getElementById("class-name-grade-add").textContent = (maxGrade + 1) + "年を追加";
    if (data.user[USER_ID].grade) {
        gradeSelect.value = data.user[USER_ID].grade.toString();
    } else {
        gradeSelect.value = data.user[classNames[0]].grade.toString();
    }

    const classNamesSelect = document.getElementById("class-name-class-select");
    while (classNamesSelect.firstChild) {
        classNamesSelect.removeChild(classNamesSelect.firstChild);
    }
    for (let i = 0; i < classNames.length; i++) {
        const classOptionElement = document.createElement("option");
        classNamesSelect.appendChild(classOptionElement);
        classOptionElement.appendChild(document.createTextNode(classNames[i]));
        classOptionElement.value = classNames[i];
    }
    if (data.user[USER_ID].className) {
        classNamesSelect.value = data.user[USER_ID].className;
    } else {
        classNamesSelect.value = classNames[0];
    }
}
document.getElementById("class-name-grade-add").dataset.nextGrade = "1";
document.getElementById("class-name-grade-add").addEventListener("click", event => {
    const newGrade = parseInt(document.getElementById("class-name-grade-add").dataset.nextGrade);
    const newGradeOptionElement = document.createElement("option");
    document.getElementById("class-name-grade").appendChild(newGradeOptionElement);
    newGradeOptionElement.appendChild(document.createTextNode(newGrade + "年"));
    newGradeOptionElement.value = newGrade.toString();
    document.getElementById("class-name-grade").value = newGrade.toString();
    document.getElementById("class-name-grade").dispatchEvent(new Event("change"));
    document.getElementById("class-name-grade-add").dataset.nextGrade = (newGrade + 1).toString();
    document.getElementById("class-name-grade-add").textContent = (newGrade + 1) + "年を追加";
});
document.getElementById("class-name-class-checkbox").addEventListener("change", event => {
    if (document.getElementById("class-name-class-checkbox").checked) {
        document.getElementById("class-name-class-select-container").style.display = "none";
        document.getElementById("class-name-class-input-container").style.display = "";
    } else {
        document.getElementById("class-name-class-select-container").style.display = "";
        document.getElementById("class-name-class-input-container").style.display = "none";
    }
});
document.getElementById("class-name-class-checkbox").dispatchEvent(new Event("change"));
document.getElementById("class-name-class-select").addEventListener("change", event => {
    const value = document.getElementById("class-name-class-select").value;
    if (data.classes[value]) {
        document.getElementById("class-name-grade").value = data.classes[value].grade.toString();
    }
});
document.getElementById("class-name-class-input").addEventListener("change", event => {
    const value = document.getElementById("class-name-class-input").value;
    if (data.classes[value]) {
        document.getElementById("class-name-grade").value = data.classes[value].grade.toString();
    }
});
document.getElementById("class-name").addEventListener("submit", event => {
    event.preventDefault();
    let grade = parseInt(document.getElementById("class-name-grade").value);
    let className;
    if (!document.getElementById("class-name-class-checkbox").checked) {
        className = document.getElementById("class-name-class-select").value;
    } else {
        className = document.getElementById("class-name-class-input").value;
    }
    if (data.classes[className]) {
        grade = data.classes[className].grade;
    }
    fieldSetDictionary.className.disabled = true;
    fieldSetDictionary.table.disabled = true;
    addChanges({
        type: "user",
        key: {
            userId: USER_ID
        },
        changes: [
            {
                method: "edit",
                key: "grade",
                value: grade
            },
            {
                method: "edit",
                key: "className",
                value: className
            }
        ]
    });
});

// 時間割
/** @type {string[]} */
let AllSubjects = [];
/** @type {HTMLDivElement[]} */
let tableClassSubjectsElements = [];
/** @type {{element:HTMLDivElement, select:HTMLSelectElement, input:HTMLInputElement, checkbox:HTMLInputElement, upButton:HTMLButtonElement, downButton:HTMLButtonElement}[][]} */
let tableClassSubjectElements = [];
/** @type {HTMLDivElement[]} */
let tableUserSubjectsElements = [];
/** @type {{element:HTMLDivElement, select:HTMLSelectElement, input:HTMLInputElement, checkbox:HTMLInputElement, upButton:HTMLButtonElement, downButton:HTMLButtonElement}[][]} */
let tableUserSubjectElements = [];
function tableFormInitializer() {
    const existScheduleTypes = [];
    const notExistScheduleTypes = [];
    for (let scheduleType of data.settings.scheduleTypeOrder) {
        if (data.classes[data.user[USER_ID].className].table[scheduleType]) {
            existScheduleTypes.push(scheduleType);
        } else {
            notExistScheduleTypes.push(scheduleType);
        }
    }
    if (existScheduleTypes.length == 0 && notExistScheduleTypes.length == 0) {
        document.getElementById("table-schedule-type-checkbox").checked = true;
        document.getElementById("table-schedule-type-checkbox").dispatchEvent(new Event("change"));
        document.getElementById("table-schedule-type-checkbox").disabled = true;
    } else {
        const scheduleTypeSelect = document.getElementById("table-schedule-type-select");
        while (scheduleTypeSelect.firstChild) {
            scheduleTypeSelect.removeChild(scheduleTypeSelect.firstChild);
        }
        for (let i = 0; i < existScheduleTypes.length; i++) {
            const scheduleTypeOption = document.createElement("option");
            scheduleTypeSelect.appendChild(scheduleTypeOption);
            scheduleTypeOption.appendChild(document.createTextNode(existScheduleTypes[i]));
            scheduleTypeOption.value = existScheduleTypes[i];
        }
        if (existScheduleTypes.length > 0 && notExistScheduleTypes.length > 0) {
            scheduleTypeSelect.appendChild(document.createElement("hr"));
        }
        for (let i = 0; i < notExistScheduleTypes.length; i++) {
            const scheduleTypeOption = document.createElement("option");
            scheduleTypeSelect.appendChild(scheduleTypeOption);
            scheduleTypeOption.appendChild(document.createTextNode(notExistScheduleTypes[i]));
            scheduleTypeOption.value = notExistScheduleTypes[i];
        }
        if (existScheduleTypes.length > 0) {
            scheduleTypeSelect.value = existScheduleTypes[0];
        } else {
            scheduleTypeSelect.value = notExistScheduleTypes[0];
        }
    }
    AllSubjects = getAllSubjects(USER_ID);
}
function createTablePeriodsContainer() {
    const period = tableClassSubjectsElements.length + 1;  // インデックスはperiod - 1を使用
}
/**
 * @param {number} period
 * @param {boolean} [isUser = false]
 * @param {string} [initialValue]
 */
function createSubjectElement(period, isUser = false, initialValue) {
    const periodIndex = period - 1;
    const subjectElement = document.createElement("div");
    if (!isUser) {
        tableClassSubjectsElements[periodIndex].appendChild(subjectElement);
    } else {
        tableUserSubjectsElements[periodIndex].appendChild(subjectElement);
    }
    const selectElement = document.createElement("select");
    subjectElement.appendChild(selectElement);
    const inputElement = document.createElement("input");
    subjectElement.appendChild(inputElement);
    inputElement.type = "text";
    const checkboxLabel = document.createElement("label");
    subjectElement.appendChild(checkboxLabel);
    checkboxLabel.appendChild(document.createTextNode("入力："))
    const checkbox = document.createElement("input");
    checkboxLabel.appendChild(checkbox);
    checkbox.type = "checkbox";
    const upButton = document.createElement("button");
    subjectElement.appendChild(upButton);
    upButton.type = "button";
    upButton.appendChild(document.createTextNode("↑"));
    upButton.ariaLabel = "上へ移動";
    if (!isUser) {
        upButton.addEventListener("click", event => {
            const currentIndex = parseInt(subjectElement.dataset.index);
            if (currentIndex > 0) {
                const changeElement = tableClassSubjectElements[periodIndex][currentIndex - 1].element;
                tableClassSubjectsElements[periodIndex].insertBefore(subjectElement, changeElement);
                const temp = tableClassSubjectElements[periodIndex][currentIndex];
                tableClassSubjectElements[periodIndex][currentIndex] = tableClassSubjectElements[periodIndex][currentIndex - 1];
                tableClassSubjectElements[periodIndex][currentIndex - 1] = temp;
                if (currentIndex == 1) {}
                if (currentIndex == tableClassSubjectElements[periodIndex].length - 1) {}
            }
        });
    } else {
        upButton.addEventListener("click", event => {});
    }
    const downButton = document.createElement("button");
    subjectElement.appendChild(downButton);
    downButton.type = "button";
    downButton.appendChild(document.createTextNode("↓"));
    downButton.ariaLabel = "下へ移動";
    if (!isUser) {
        downButton.addEventListener("click", event => {});
    } else {
        downButton.addEventListener("click", event => {});
    }
    const deleteButton = document.createElement("button");
    subjectElement.appendChild(deleteButton);
    deleteButton.type = "button";
    deleteButton.appendChild(document.createTextNode("×"));
    deleteButton.ariaLabel = "削除";
    if (!isUser) {
        deleteButton.addEventListener("click", event => {});
    } else {
        deleteButton.addEventListener("click", event => {});
    }
    if (!isUser) {
        if (!tableClassSubjectElements[periodIndex]) tableClassSubjectElements[periodIndex] = [];
        const index = tableClassSubjectElements[periodIndex].length;
        subjectElement.dataset.index = index.toString();
        tableClassSubjectElements[periodIndex][index].element = subjectElement;
        tableClassSubjectElements[periodIndex][index].select = selectElement;
        tableClassSubjectElements[periodIndex][index].input = inputElement;
        tableClassSubjectElements[periodIndex][index].checkbox = checkbox;
        tableClassSubjectElements[periodIndex][index].upButton = upButton;
        tableClassSubjectElements[periodIndex][index].downButton = downButton;
        if (index == 0) {
            upButton.disabled = true;
        }
        downButton.disabled = true;
        if (index > 0) {
            tableClassSubjectElements[periodIndex][index - 1].downButton.disabled = false;
        }
    } else {
        if (!tableUserSubjectElements[periodIndex]) tableUserSubjectElements[periodIndex] = [];
        const index = tableUserSubjectElements[periodIndex].length;
        subjectElement.dataset.index = index.toString();
        tableUserSubjectElements[periodIndex][index].element = subjectElement;
        tableUserSubjectElements[periodIndex][index].select = selectElement;
        tableUserSubjectElements[periodIndex][index].input = inputElement;
        tableUserSubjectElements[periodIndex][index].checkbox = checkbox;
        tableUserSubjectElements[periodIndex][index].upButton = upButton;
        tableUserSubjectElements[periodIndex][index].downButton = downButton;
        if (index == 0) {
            upButton.disabled = true;
        }
        downButton.disabled = true;
        if (index > 0) {
            tableUserSubjectElements[periodIndex][index - 1].downButton.disabled = false;
        }
    }
}
document.getElementById("table-schedule-type-checkbox").addEventListener("change", event => {
    if (document.getElementById("table-schedule-type-checkbox").checked) {
        document.getElementById("table-schedule-type-select-container").style.display = "none";
        document.getElementById("table-schedule-type-input-container").style.display = "";
    } else {
        document.getElementById("table-schedule-type-select-container").style.display = "";
        document.getElementById("table-schedule-type-input-container").style.display = "none";
    }
});
document.getElementById("table-schedule-type-checkbox").dispatchEvent(new Event("change"));


if (data) initializeAllForms();


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./../service-worker.js");
}