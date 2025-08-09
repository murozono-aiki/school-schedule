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
    }, {
        type: "classes",
        key: {
            name: className
        },
        changes: [
            {
                method: "edit",
                key: "grade",
                value: grade
            }
        ]
    });
});

// 時間割
/** @type {string[]} */
let allSubjects = [];
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
        if (data.classes[data.user[USER_ID].className].table && data.classes[data.user[USER_ID].className].table[scheduleType]) {
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
            document.getElementById("table-schedule-type-input").value = existScheduleTypes[0];
        } else {
            scheduleTypeSelect.value = notExistScheduleTypes[0];
            document.getElementById("table-schedule-type-input").value = notExistScheduleTypes[0];
        }
    }
    allSubjects = getAllSubjects(USER_ID);
    resetTablePeriodContainer();
}
function resetTablePeriodContainer() {
    const periodsContainer = document.getElementById("table-periods-container");
    while (periodsContainer.firstChild) {
        periodsContainer.removeChild(periodsContainer.firstChild);
    }
    tableClassSubjectsElements = [];
    tableClassSubjectElements = [];
    tableUserSubjectsElements = [];
    tableUserSubjectElements = [];
    let maxPeriod = 0;
    if (data.classes[data.user[USER_ID].className].table) {
        let scheduleType;
        if (!document.getElementById("table-schedule-type-checkbox").checked) {
            scheduleType = document.getElementById("table-schedule-type-select").value;
        } else {
            scheduleType = document.getElementById("table-schedule-type-input").value;
        }
        if (data.classes[data.user[USER_ID].className].table[scheduleType] && data.classes[data.user[USER_ID].className].table[scheduleType].schedule) {
            maxPeriod = data.classes[data.user[USER_ID].className].table[scheduleType].schedule.length - 1;  // 最初の要素は除く
        }
    }
    for (let i = 0; i < maxPeriod; i++) {
        createTablePeriodsContainer();
    }
    document.getElementById("table-period-add").textContent = (tableClassSubjectsElements.length + 1) + "時限目を追加";
}
function createTablePeriodsContainer() {
    const periodIndex = tableClassSubjectsElements.length;
    const period = periodIndex + 1;
    const periodElement = document.createElement("section");
    document.getElementById("table-periods-container").appendChild(periodElement);
    const headerElement = document.createElement("h3");
    periodElement.appendChild(headerElement);
    headerElement.appendChild(document.createTextNode(period + "時限目"));
    const userCheckboxLabel = document.createElement("label");
    periodElement.appendChild(userCheckboxLabel);
    userCheckboxLabel.appendChild(document.createTextNode("ユーザーの時間割を表示："))
    const userCheckbox = document.createElement("input");
    userCheckboxLabel.appendChild(userCheckbox);
    userCheckbox.type = "checkbox";
    const classSubjectsSectionElement = document.createElement("section");
    periodElement.appendChild(classSubjectsSectionElement);
    const classSubjectsElement = document.createElement("div");
    classSubjectsSectionElement.appendChild(classSubjectsElement);
    tableClassSubjectsElements[periodIndex] = classSubjectsElement;
    const classSubjectsAddButton = document.createElement("button");
    classSubjectsSectionElement.appendChild(classSubjectsAddButton);
    classSubjectsAddButton.type = "button";
    classSubjectsAddButton.appendChild(document.createTextNode("追加"));
    classSubjectsAddButton.addEventListener("click", event => {
        createSubjectElement(period, false);
    });
    const userSubjectsSectionElement = document.createElement("section");
    periodElement.appendChild(userSubjectsSectionElement);
    const userSubjectsSectionHeader = document.createElement("h4");
    userSubjectsSectionElement.appendChild(userSubjectsSectionHeader);
    userSubjectsSectionHeader.appendChild(document.createTextNode("ユーザー"));
    const userSubjectsElement = document.createElement("div");
    userSubjectsSectionElement.appendChild(userSubjectsElement);
    tableUserSubjectsElements[periodIndex] = userSubjectsElement;
    const userSubjectsAddButton = document.createElement("button");
    userSubjectsSectionElement.appendChild(userSubjectsAddButton);
    userSubjectsAddButton.type = "button";
    userSubjectsAddButton.appendChild(document.createTextNode("追加"));
    userSubjectsAddButton.addEventListener("click", event => {
        createSubjectElement(period, true);
    });
    userCheckbox.addEventListener("change", event => {
        if (!userCheckbox.checked) {
            userSubjectsSectionElement.style.display = "none";
        } else {
            userSubjectsSectionElement.style.display = "";
        }
    });
    userCheckbox.dispatchEvent(new Event("change"));
    if (data.classes[data.user[USER_ID].className].table) {
        let scheduleType;
        if (!document.getElementById("table-schedule-type-checkbox").checked) {
            scheduleType = document.getElementById("table-schedule-type-select").value;
        } else {
            scheduleType = document.getElementById("table-schedule-type-input").value;
        }
        if (data.classes[data.user[USER_ID].className].table[scheduleType] && data.classes[data.user[USER_ID].className].table[scheduleType].schedule) {
            if (data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period]) {  // こっちはperiodIndexでなくperiod
                if (data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].subject) {
                    for (let i = 0; i < data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].subject.length; i++) {
                        if (!data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].subject[i]) continue;
                        createSubjectElement(period, false, data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].subject[i]);
                    }
                }
                if (data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].userSetting && data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].userSetting[USER_ID]) {
                    if (data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].userSetting[USER_ID].subject) {
                        for (let i = 0; i < data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].userSetting[USER_ID].subject.length; i++) {
                            if (!data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].userSetting[USER_ID].subject[i]) continue;
                            createSubjectElement(period, true, data.classes[data.user[USER_ID].className].table[scheduleType].schedule[period].userSetting[USER_ID].subject[i]);
                        }
                    }
                }
            }
        }
    }
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
    selectElement.style.boxSizing = "border-box";
    selectElement.style.width = "8rem";
    for (let i = 0; i < allSubjects.length; i++) {
        const subjectOption = document.createElement("option");
        selectElement.appendChild(subjectOption);
        subjectOption.appendChild(document.createTextNode(allSubjects[i]));
        subjectOption.value = allSubjects[i];
    }
    if (allSubjects.length > 0) {
        selectElement.value = allSubjects[0];
    }
    if (initialValue && allSubjects.includes(initialValue)) {
        selectElement.value = initialValue;
    }
    const inputElement = document.createElement("input");
    subjectElement.appendChild(inputElement);
    inputElement.type = "text";
    inputElement.style.boxSizing = "border-box";
    inputElement.style.width = "8rem";
    if (initialValue) {
        inputElement.value = initialValue;
    }
    selectElement.addEventListener("change", event => {
        inputElement.value = selectElement.value;
    });
    inputElement.addEventListener("change", event => {
        if (allSubjects.includes(inputElement.value)) {
            selectElement.value = inputElement.value;
        }
    });
    const checkboxLabel = document.createElement("label");
    subjectElement.appendChild(checkboxLabel);
    checkboxLabel.appendChild(document.createTextNode("入力："));
    checkboxLabel.style.marginLeft = "0.2rem";
    const checkbox = document.createElement("input");
    checkboxLabel.appendChild(checkbox);
    checkbox.type = "checkbox";
    if (allSubjects.length == 0) {
        checkbox.checked = true;
        checkbox.disabled = true;
    } else if (initialValue && !allSubjects.includes(initialValue)) {
        checkbox.checked = true;
    }
    checkbox.addEventListener("change", event => {
        if (!checkbox.checked) {
            selectElement.style.display = "";
            inputElement.style.display = "none";
        } else {
            selectElement.style.display = "none";
            inputElement.style.display = "";
        }
    });
    checkbox.dispatchEvent(new Event("change"));
    const buttonsElement = document.createElement("div");
    subjectElement.appendChild(buttonsElement);
    buttonsElement.style.display = "inline-block";
    buttonsElement.style.whiteSpace = "nowrap";
    const upButton = document.createElement("button");
    buttonsElement.appendChild(upButton);
    upButton.type = "button";
    upButton.appendChild(document.createTextNode("↑"));
    upButton.title = "上へ移動";
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
                subjectElement.dataset.index = (currentIndex - 1).toString();
                tableClassSubjectElements[periodIndex][currentIndex].element.dataset.index = currentIndex.toString();
                if (currentIndex == 1) {
                    tableClassSubjectElements[periodIndex][0].upButton.disabled = true;
                    tableClassSubjectElements[periodIndex][1].upButton.disabled = false;
                }
                if (currentIndex == tableClassSubjectElements[periodIndex].length - 1) {
                    const length = tableClassSubjectElements[periodIndex].length;
                    tableClassSubjectElements[periodIndex][length - 2].downButton.disabled = false;
                    tableClassSubjectElements[periodIndex][length - 1].downButton.disabled = true;
                }
            }
        });
    } else {
        upButton.addEventListener("click", event => {
            const currentIndex = parseInt(subjectElement.dataset.index);
            if (currentIndex > 0) {
                const changeElement = tableUserSubjectElements[periodIndex][currentIndex - 1].element;
                tableUserSubjectsElements[periodIndex].insertBefore(subjectElement, changeElement);
                const temp = tableUserSubjectElements[periodIndex][currentIndex];
                tableUserSubjectElements[periodIndex][currentIndex] = tableUserSubjectElements[periodIndex][currentIndex - 1];
                tableUserSubjectElements[periodIndex][currentIndex - 1] = temp;
                subjectElement.dataset.index = (currentIndex - 1).toString();
                tableUserSubjectElements[periodIndex][currentIndex].element.dataset.index = currentIndex.toString();
                if (currentIndex == 1) {
                    tableUserSubjectElements[periodIndex][0].upButton.disabled = true;
                    tableUserSubjectElements[periodIndex][1].upButton.disabled = false;
                }
                if (currentIndex == tableUserSubjectElements[periodIndex].length - 1) {
                    const length = tableUserSubjectElements[periodIndex].length;
                    tableUserSubjectElements[periodIndex][length - 2].downButton.disabled = false;
                    tableUserSubjectElements[periodIndex][length - 1].downButton.disabled = true;
                }
            }
        });
    }
    const downButton = document.createElement("button");
    buttonsElement.appendChild(downButton);
    downButton.type = "button";
    downButton.appendChild(document.createTextNode("↓"));
    downButton.title = "下へ移動";
    downButton.ariaLabel = "下へ移動";
    if (!isUser) {
        downButton.addEventListener("click", event => {
            const currentIndex = parseInt(subjectElement.dataset.index);
            if (currentIndex < tableClassSubjectElements[periodIndex].length - 1) {
                const changeElement = tableClassSubjectElements[periodIndex][currentIndex + 1].element;
                tableClassSubjectsElements[periodIndex].insertBefore(changeElement, subjectElement);
                const temp = tableClassSubjectElements[periodIndex][currentIndex];
                tableClassSubjectElements[periodIndex][currentIndex] = tableClassSubjectElements[periodIndex][currentIndex + 1];
                tableClassSubjectElements[periodIndex][currentIndex + 1] = temp;
                subjectElement.dataset.index = (currentIndex + 1).toString();
                tableClassSubjectElements[periodIndex][currentIndex].element.dataset.index = currentIndex.toString();
                if (currentIndex == 0) {
                    tableClassSubjectElements[periodIndex][0].upButton.disabled = true;
                    tableClassSubjectElements[periodIndex][1].upButton.disabled = false;
                }
                if (currentIndex == tableClassSubjectElements[periodIndex].length - 2) {
                    const length = tableClassSubjectElements[periodIndex].length;
                    tableClassSubjectElements[periodIndex][length - 2].downButton.disabled = false;
                    tableClassSubjectElements[periodIndex][length - 1].downButton.disabled = true;
                }
            }
        });
    } else {
        downButton.addEventListener("click", event => {
            const currentIndex = parseInt(subjectElement.dataset.index);
            if (currentIndex < tableUserSubjectElements[periodIndex].length - 1) {
                const changeElement = tableUserSubjectElements[periodIndex][currentIndex + 1].element;
                tableUserSubjectsElements[periodIndex].insertBefore(changeElement, subjectElement);
                const temp = tableUserSubjectElements[periodIndex][currentIndex];
                tableUserSubjectElements[periodIndex][currentIndex] = tableUserSubjectElements[periodIndex][currentIndex + 1];
                tableUserSubjectElements[periodIndex][currentIndex + 1] = temp;
                subjectElement.dataset.index = (currentIndex + 1).toString();
                tableUserSubjectElements[periodIndex][currentIndex].element.dataset.index = currentIndex.toString();
                if (currentIndex == 0) {
                    tableUserSubjectElements[periodIndex][0].upButton.disabled = true;
                    tableUserSubjectElements[periodIndex][1].upButton.disabled = false;
                }
                if (currentIndex == tableUserSubjectElements[periodIndex].length - 2) {
                    const length = tableUserSubjectElements[periodIndex].length;
                    tableUserSubjectElements[periodIndex][length - 2].downButton.disabled = false;
                    tableUserSubjectElements[periodIndex][length - 1].downButton.disabled = true;
                }
            }
        });
    }
    const deleteButton = document.createElement("button");
    buttonsElement.appendChild(deleteButton);
    deleteButton.type = "button";
    deleteButton.appendChild(document.createTextNode("×"));
    deleteButton.title = "削除";
    deleteButton.ariaLabel = "削除";
    if (!isUser) {
        deleteButton.addEventListener("click", event => {
            const currentIndex = parseInt(subjectElement.dataset.index);
            tableClassSubjectsElements[periodIndex].removeChild(subjectElement);
            tableClassSubjectElements[periodIndex].splice(currentIndex, 1);
            for (let i = currentIndex; i < tableClassSubjectElements[periodIndex].length; i++) {
                tableClassSubjectElements[periodIndex][i].element.dataset.index = i.toString();
            }
        });
    } else {
        deleteButton.addEventListener("click", event => {
            const currentIndex = parseInt(subjectElement.dataset.index);
            tableUserSubjectsElements[periodIndex].removeChild(subjectElement);
            tableUserSubjectElements[periodIndex].splice(currentIndex, 1);
            for (let i = currentIndex; i < tableUserSubjectElements[periodIndex].length; i++) {
                tableUserSubjectElements[periodIndex][i].element.dataset.index = i.toString();
            }
        });
    }
    if (!isUser) {
        if (!tableClassSubjectElements[periodIndex]) tableClassSubjectElements[periodIndex] = [];
        const index = tableClassSubjectElements[periodIndex].length;
        subjectElement.dataset.index = index.toString();
        tableClassSubjectElements[periodIndex][index] = {};
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
        tableUserSubjectElements[periodIndex][index] = {};
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
    const reset = (document.getElementById("table-schedule-type-select").value != document.getElementById("table-schedule-type-input").value);
    if (document.getElementById("table-schedule-type-checkbox").checked) {
        document.getElementById("table-schedule-type-select-container").style.display = "none";
        document.getElementById("table-schedule-type-input-container").style.display = "";
    } else {
        document.getElementById("table-schedule-type-select-container").style.display = "";
        document.getElementById("table-schedule-type-input-container").style.display = "none";
        document.getElementById("table-schedule-type-input").value = document.getElementById("table-schedule-type-select").value;
    }
    if (reset) {
        resetTablePeriodContainer();
    }
});
document.getElementById("table-schedule-type-checkbox").dispatchEvent(new Event("change"));
document.getElementById("table-schedule-type-select").addEventListener("change", event => {
    document.getElementById("table-schedule-type-input").value = document.getElementById("table-schedule-type-select").value;
    resetTablePeriodContainer();
});
document.getElementById("table-schedule-type-input").addEventListener("input", event => {
    const value = document.getElementById("table-schedule-type-input").value;
    if (data.settings.scheduleTypeOrder.includes(value)) {
        document.getElementById("table-schedule-type-select").value = value;
    }
    resetTablePeriodContainer();
});
document.getElementById("table-period-add").addEventListener("click", event => {
    createTablePeriodsContainer();
    document.getElementById("table-period-add").textContent = (tableClassSubjectsElements.length + 1) + "時限目を追加";
});
document.getElementById("table").addEventListener("submit", event => {
    event.preventDefault();
    /**
     * @param {{element:HTMLDivElement, select:HTMLSelectElement, input:HTMLInputElement, checkbox:HTMLInputElement, upButton:HTMLButtonElement, downButton:HTMLButtonElement}[][]} subjectElements
     * @returns {string[][]}
     */
    const createUserInput = subjectElements => {
        /** @type {string[][]} */
        const result = [];
        for (let periodIndex = 0; periodIndex < subjectElements.length; periodIndex++) {
            if (!subjectElements[periodIndex]) continue;
            for (let i = 0; i < subjectElements[periodIndex].length; i++) {
                const subjectElement = subjectElements[periodIndex][i];
                let value;
                if (!subjectElement.checkbox.checked) {
                    value = subjectElement.select.value;
                } else {
                    value = subjectElement.input.value;
                }
                if (value) {
                    if (!result[periodIndex]) result[periodIndex] = [];
                    result[periodIndex].push(value);
                }
            }
        }
        return result;
    };
    /**
     * @param {string[][]} afterSubjects
     * @param {string[][]} beforeSubjects
     * @returns {(editChange | addChange | deleteChange)[][]}
     */
    const compareSubjects = (afterSubjects, beforeSubjects) => {
        /** @type {(editChange | addChange | deleteChange)[][]} */
        const result = [];
        const maxPeriod = Math.max(afterSubjects.length, beforeSubjects.length);
        for (let periodIndex = 0; periodIndex < maxPeriod; periodIndex++) {
            result[periodIndex] = [];
            const currentAfterSubjects = afterSubjects[periodIndex] || [];
            const currentBeforeSubjects = beforeSubjects[periodIndex] || [];
            const changedSubjects = new Array(...currentBeforeSubjects);
            // 削除された科目を確認
            for (let i = 0; i < currentBeforeSubjects.length; i++) {
                if (!currentAfterSubjects.includes(currentBeforeSubjects[i])) {
                    result[periodIndex].push({
                        method: "delete",
                        key: "subject",
                        deleteValue: currentBeforeSubjects[i]
                    });
                    changedSubjects.splice(changedSubjects.indexOf(currentBeforeSubjects[i]), 1);
                }
            }
            // 追加された科目を確認
            for (let i = 0; i < currentAfterSubjects.length; i++) {
                if (!currentBeforeSubjects.includes(currentAfterSubjects[i])) {
                    result[periodIndex].push({
                        method: "add",
                        key: "subject",
                        value: currentAfterSubjects[i]
                    });
                    changedSubjects.push(currentAfterSubjects[i]);
                }
            }
            // 順番の入れ替えを確認
            for (let i = changedSubjects.length - 1; i >= 0; i--) {
                if (changedSubjects[i] != currentAfterSubjects[i]) {
                    result[periodIndex].push({
                        method: "edit",
                        key: "subject",
                        editValue: changedSubjects[i],
                        value: currentAfterSubjects[i]
                    });
                }
            }
        }
        return result;
    };
    /** @type {changeData} */
    const changes = [];
    let scheduleType;
    if (!document.getElementById("table-schedule-type-checkbox").checked) {
        scheduleType = document.getElementById("table-schedule-type-select").value;
    } else {
        scheduleType = document.getElementById("table-schedule-type-input").value;
    }
    if (!data.settings.scheduleTypeOrder.includes(scheduleType)) {
        changes.push({
            type: "settings",
            changes: [
                {
                    method: "add",
                    key: "scheduleTypeOrder",
                    value: scheduleType
                }
            ]
        });
    }
    const tableObjectsBefore = data.classes[data.user[USER_ID].className].table && data.classes[data.user[USER_ID].className].table[scheduleType] && data.classes[data.user[USER_ID].className].table[scheduleType].schedule;
    // クラスの時間割
    const tableClassBefore = [];
    if (tableObjectsBefore) {
        for (let period = 0; period < tableObjectsBefore.length; period++) {
            if (tableObjectsBefore[period]) {
                tableClassBefore[period - 1] = tableObjectsBefore[period].subject;
            }
        }
    }
    const tableClassDifferences = compareSubjects(createUserInput(tableClassSubjectElements), tableClassBefore);
    /** @type {structuredChange[]} */
    const tableClassChanges = [];
    for (let periodIndex = 0; periodIndex < tableClassDifferences.length; periodIndex++) {
        for (let i = 0; i < tableClassDifferences[periodIndex].length; i++) {
            tableClassChanges.push({
                method: "structuredChange",
                key: "table",
                change: {
                    method: "structuredChange",
                    key: scheduleType,
                    change: {
                        method: "structuredChange",
                        key: "schedule",
                        period: periodIndex + 1,
                        change: tableClassDifferences[periodIndex][i]
                    }
                }
            });
        }
    }
    if (tableClassChanges.length > 0) {
        changes.push({
            type: "classes",
            key: {
                name: data.user[USER_ID].className
            },
            changes: tableClassChanges
        });
    }
    // ユーザーの時間割
    const tableUserBefore = [];
    if (tableObjectsBefore) {
        for (let period = 0; period < tableObjectsBefore.length; period++) {
            if (tableObjectsBefore[period] && tableObjectsBefore[period].userSetting && tableObjectsBefore[period].userSetting[USER_ID]) {
                tableUserBefore[period - 1] = tableObjectsBefore[period].userSetting[USER_ID].subject;
            }
        }
    }
    const tableUserDifferences = compareSubjects(createUserInput(tableUserSubjectElements), tableUserBefore);
    /** @type {structuredChange[]} */
    const tableUserChanges = [];
    for (let periodIndex = 0; periodIndex < tableUserDifferences.length; periodIndex++) {
        for (let i = 0; i < tableUserDifferences[periodIndex].length; i++) {
            tableUserChanges.push({
                method: "structuredChange",
                key: "table",
                change: {
                    method: "structuredChange",
                    key: scheduleType,
                    change: {
                        method: "structuredChange",
                        key: "schedule",
                        period: periodIndex + 1,
                        change: {
                            method: "structuredChange",
                            key: "userSetting",
                            change: {
                                method: "structuredChange",
                                key: USER_ID,
                                change: tableUserDifferences[periodIndex][i]
                            }
                        }
                    }
                }
            });
        }
    }
    if (tableUserChanges.length > 0) {
        changes.push({
            type: "classes",
            key: {
                name: data.user[USER_ID].className
            },
            changes: tableUserChanges
        });
    }
    if (changes.length > 0) {
        fieldSetDictionary.table.disabled = true;
        addChanges(...changes);
    }
});


if (data) initializeAllForms();


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./../service-worker.js");
}