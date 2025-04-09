/**
 * 曜日を表す文字列
 * @type {string[]}
 */
const DAY_NAME = ["日", "月", "火", "水", "木", "金", "土"];

let USER_ID = "";
let API_URL = "";

/**
 * @type {changeData}
 */
let changesData = [];
let changingDataCount = 0;
let changingLoadCount = 0;


let _dateForInitialize = new Date();

/**
 * 現在表示している日（0000-00-00の形）
 * @type {string}
 */
let currentDate = dateToString(_dateForInitialize);
/**
 * 現在の通信数
 */
let loadCount = 0;

/**
 * 今日の日付（0000-00-00の形）
 */
const TODAY_DATE_STRING = dateToString(_dateForInitialize);
_dateForInitialize.setDate(_dateForInitialize.getDate() + 1);
/**
 * 明日の日付（0000-00-00の形）
 */
const TOMORROW_DATE_STRING = dateToString(_dateForInitialize);
_dateForInitialize = null;

/**
 * カレンダーの年
 * @type {number}
 */
let dateTableYear = 0;
/**
 * カレンダーの月（0が1月）
 * @type {number}
 */
let dateTableMonth = 0;

try {
    USER_ID = localStorage.getItem("school-schedule_userId");
    API_URL = localStorage.getItem("school-schedule_URL");
    data = JSON.parse(localStorage.getItem("school-schedule_data"));
    let lastCurrentDate = sessionStorage.getItem("currentDate");
    if (lastCurrentDate) currentDate = lastCurrentDate;
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
if (!USER_ID || !API_URL) {
    showFirstDialog();
} else {
    getDataAndUpdate();
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
 * データを取得し画面を更新
 */
function getDataAndUpdate() {
    getData(responseData => {
        if (!responseData.error) {
            let existData = true;
            if (!data) existData = false;
            data = responseData;
            if (existData) updateSchedule();
            else updateCurrentDate();
        } else {
            if (responseData.message == "INVALID_USER_ID") {
                showFirstDialog("ユーザーidが誤っています。");
            }
        }
    });
}
if (data) updateCurrentDate();

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
                    updateSchedule();
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

/**
 * date-tableを作成する関数
 * @param {Date} date - カレンダーに含む日
 */
function createDateTable(date) {
    const _date = new Date(date);
    const month = _date.getMonth();
    dateTableYear = _date.getFullYear();
    dateTableMonth = month;
    document.getElementById("date-table-month").textContent = month + 1 + "月";
    _date.setDate(1);
    if (_date.getFullYear() == new Date().getFullYear() && _date.getMonth() == new Date().getMonth()) {
        document.getElementById("date-table-last-month").disabled = true;
    } else {
        document.getElementById("date-table-last-month").disabled = false;
    }
    if (_date.getDay() <= 1) {
        _date.setDate(_date.getDate() - 7);  // 月が月曜日又は火曜日で始まる場合、一週間前から表示
    }
    _date.setDate(_date.getDate() - _date.getDay());  // 日曜日に設定

    let is_beforeToday = false;
    if (_date.getTime() < new Date().getTime()) is_beforeToday = true;

    const dateTable = document.createElement("table");
    document.getElementById("date-table").replaceWith(dateTable);
    dateTable.id = "date-table";

    const dateTableHeaderRow = document.createElement("tr");
    dateTable.appendChild(dateTableHeaderRow);
    for (let day = 0; day < DAY_NAME.length; day++) {
        const dateTableHeader = document.createElement("th");
        dateTableHeaderRow.appendChild(dateTableHeader);
        dateTableHeader.appendChild(document.createTextNode(DAY_NAME[day]));
    }
    for (let row = 0; row < 6; row++) {
        const dateTableRow = document.createElement("tr");
        dateTable.appendChild(dateTableRow);
        for (let day = 0; day < DAY_NAME.length; day++) {
            let dateString = dateToString(_date);

            const dateTableData = document.createElement("td");
            dateTableRow.appendChild(dateTableData);
            if (dateString == currentDate) dateTableData.classList.add("selected");
            if (_date.getMonth() != month) dateTableData.classList.add("gray");

            const dateButton = document.createElement("button");
            dateTableData.appendChild(dateButton);
            dateButton.appendChild(document.createTextNode(_date.getDate().toString()));
            if (dateString == TODAY_DATE_STRING) {
                dateButton.style.textDecoration = "underline";
                is_beforeToday = false;
            }
            if (is_beforeToday) dateButton.disabled = true;

            dateButton.addEventListener("click", event => {
                updateCurrentDate(dateString);
            });
            
            _date.setDate(_date.getDate() + 1);
        }
    }
}
createDateTable(dateStringToDate(currentDate));

function updateSchedule() {
    updateScheduleViewer();
    if (changesData.length == 0) {
        updateScheduleEditor();
    }
}

/**
 * 予定を更新する関数
 */
function updateScheduleViewer() {
    const scheduleElement = document.createElement("div");
    document.getElementById("schedule").replaceWith(scheduleElement);
    scheduleElement.id = "schedule";

    /** @param {string[]} list */
    const createList = list => {
        const listElement = document.createElement("ul");
        scheduleElement.appendChild(listElement);
        for (let i = 0; i < list.length; i++) {
            const element = document.createElement("li");
            listElement.appendChild(element);
            element.appendChild(document.createTextNode(list[i]));
        }
    }

    let currentSchedule = getSchedule(currentDate, USER_ID);
    if (currentSchedule.scheduleType) {
        const scheduleTypeElement = document.createElement("div");
        scheduleElement.appendChild(scheduleTypeElement);
        scheduleTypeElement.classList.add("scheduleType");
        scheduleTypeElement.appendChild(document.createTextNode(currentSchedule.scheduleType));
    }
    let is_school = false
    if (currentSchedule.schedule.length > 1) {
        for (let period = 1; period < currentSchedule.schedule.length; period++) {
            const currentPeriod = currentSchedule.schedule[period];
            if (!currentPeriod || currentPeriod.length == 0) continue;
            is_school = true;
            const periodHeader = document.createElement("h3");
            scheduleElement.appendChild(periodHeader);
            periodHeader.appendChild(document.createTextNode(`${period}時限目`));
    
            for (let index = 0; index < currentPeriod.length; index++) {
                const subject = currentPeriod[index];
                if (!subject || !subject.subject) continue;
                const subjectHeadr = document.createElement("h4");
                scheduleElement.appendChild(subjectHeadr);
                subjectHeadr.appendChild(document.createTextNode(`${subject.subject}`));
                if (subject.time) {
                    const timeElement = document.createElement("div");
                    scheduleElement.appendChild(timeElement);
                    timeElement.className = "time";
                    timeElement.appendChild(document.createTextNode(`${subject.time}`));
                }
                if (subject.homework && subject.homework.length >= 1) {
                    const homeworkHeader = document.createElement("h5");
                    scheduleElement.appendChild(homeworkHeader);
                    homeworkHeader.appendChild(document.createTextNode("宿題"));
                    createList(subject.homework);
                }
                if (subject.submit && subject.submit.length >= 1) {
                    const submitHeader = document.createElement("h5");
                    scheduleElement.appendChild(submitHeader);
                    submitHeader.appendChild(document.createTextNode("提出物"));
                    createList(subject.submit);
                }
                if (subject.bring && subject.bring.length >= 1) {
                    const bringHeader = document.createElement("h5");
                    scheduleElement.appendChild(bringHeader);
                    bringHeader.appendChild(document.createTextNode("持ち物"));
                    createList(subject.bring);
                }
                if (subject.event && subject.event.length >= 1) {
                    const eventHeader = document.createElement("h5");
                    scheduleElement.appendChild(eventHeader);
                    eventHeader.appendChild(document.createTextNode("イベント"));
                    createList(subject.event);
                }
                if (subject.note && subject.note.length >= 1) {
                    const noteHeader = document.createElement("h5");
                    scheduleElement.appendChild(noteHeader);
                    noteHeader.appendChild(document.createTextNode("備考"));
                    createList(subject.note);
                }
            }
        }
    }
    if (!is_school) {
        const noClassElement = document.createElement("p");
        scheduleElement.appendChild(noClassElement);
        noClassElement.appendChild(document.createTextNode(`授業はありません`));
    }
    if (currentSchedule.schedule[0] && currentSchedule.schedule[0].length >= 1) {
        const currentPeriod = currentSchedule.schedule[0];
        if (currentPeriod.length >= 2 || (currentPeriod[0] && ((currentPeriod[0].homework && currentPeriod[0].homework.length >= 1) || (currentPeriod[0].submit && currentPeriod[0].submit.length >= 1) || (currentPeriod[0].bring && currentPeriod[0].bring.length >= 1) || (currentPeriod[0].event && currentPeriod[0].event.length >= 1) || (currentPeriod[0].note && currentPeriod[0].note.length >= 1)))) {
            const periodHeader = document.createElement("h3");
            scheduleElement.appendChild(periodHeader);
            periodHeader.appendChild(document.createTextNode(`その他`));

            for (let index = 0; index < currentPeriod.length; index++) {
                const subject = currentPeriod[index];
                if (!subject || !subject.subject) continue;
                if (subject.subject != "その他") {
                    const subjectHeadr = document.createElement("h4");
                    scheduleElement.appendChild(subjectHeadr);
                    subjectHeadr.appendChild(document.createTextNode(`${subject.subject}`));
                }
                if (subject.time) {
                    const timeElement = document.createElement("div");
                    scheduleElement.appendChild(timeElement);
                    timeElement.className = "time";
                    timeElement.appendChild(document.createTextNode(`${subject.time}`));
                }
                if (subject.homework && subject.homework.length >= 1) {
                    const homeworkHeader = document.createElement("h5");
                    scheduleElement.appendChild(homeworkHeader);
                    homeworkHeader.appendChild(document.createTextNode("宿題"));
                    createList(subject.homework);
                }
                if (subject.submit && subject.submit.length >= 1) {
                    const submitHeader = document.createElement("h5");
                    scheduleElement.appendChild(submitHeader);
                    submitHeader.appendChild(document.createTextNode("提出物"));
                    createList(subject.submit);
                }
                if (subject.bring && subject.bring.length >= 1) {
                    const bringHeader = document.createElement("h5");
                    scheduleElement.appendChild(bringHeader);
                    bringHeader.appendChild(document.createTextNode("持ち物"));
                    createList(subject.bring);
                }
                if (subject.event && subject.event.length >= 1) {
                    const eventHeader = document.createElement("h5");
                    scheduleElement.appendChild(eventHeader);
                    eventHeader.appendChild(document.createTextNode("イベント"));
                    createList(subject.event);
                }
                if (subject.note && subject.note.length >= 1) {
                    const noteHeader = document.createElement("h5");
                    scheduleElement.appendChild(noteHeader);
                    noteHeader.appendChild(document.createTextNode("備考"));
                    createList(subject.note);
                }
            }
        }
    }
}

/**
 * 予定の編集を更新する関数
 */
function updateScheduleEditor() {
    const scheduleEditElement = document.createElement("div");
    document.getElementById("schedule-edit").replaceWith(scheduleEditElement);
    scheduleEditElement.id = "schedule-edit";

    const scheduleEditForm = document.createElement("form");
    scheduleEditElement.appendChild(scheduleEditForm);

    const currentSchedules = getOneDaySchedules(currentDate, USER_ID);
    const currentContents = getOneDayContents(currentDate, USER_ID);

    const scheduleTypes = data.settings.scheduleTypeOrder || [];
    const table = getClassTableFromDate(currentDate, data.user[USER_ID].className);
    const timeTypes = data.settings.timeTypeOrder || [];

    /**
     * select要素にoption要素を追加する関数
     * @param {HTMLSelectElement} selectElement - option要素を追加する要素
     * @param {string} text - option要素のtextContent
     * @param {string} value - option要素のvalue属性
     */
    const addSelectOption = (selectElement, text, value) => {
        const optionElement = document.createElement("option");
        selectElement.appendChild(optionElement);
        optionElement.appendChild(document.createTextNode(text));
        optionElement.value = value;
    };
    /**
     * select要素にscheduleTypeを追加する関数
     * @param {HTMLSelectElement} selectElement - option要素を追加する要素
     */
    const addScheduleTypesToSelect = (selectElement) => {
        for (let i = 0; i < scheduleTypes.length; i++) {
            addSelectOption(selectElement, scheduleTypes[i], scheduleTypes[i]);
        }
    }
    /**
     * select要素にtimeTypeを追加する関数
     * @param {HTMLSelectElement} selectElement - option要素を追加する要素
     */
    const addTimeTypesToSelect = (selectElement) => {
        for (let i = 0; i < timeTypes.length; i++) {
            addSelectOption(selectElement, timeTypes[i], timeTypes[i]);
        }
    }
    /**
     * scopeTypeを選択するselect要素を作成する関数
     */
    const createScopeSelect = () => {
        const selectElement = document.createElement("select");
        addSelectOption(selectElement, "学校", scopeTypes[0]);
        addSelectOption(selectElement, "学年", scopeTypes[1]);
        addSelectOption(selectElement, "クラス", scopeTypes[2]);
        addSelectOption(selectElement, "ユーザー", scopeTypes[3]);
        return selectElement;
    }

    // scheduleType
        const scheduleTypeSet = document.createElement("fieldset");
        scheduleEditForm.appendChild(scheduleTypeSet);

        const scheduleTypeSetLegend = document.createElement("legend");
        scheduleTypeSet.appendChild(scheduleTypeSetLegend);
        scheduleTypeSetLegend.appendChild(document.createTextNode("授業"));

        const scheduleTypeLabel = document.createElement("label");
        scheduleTypeSet.appendChild(scheduleTypeLabel);
        scheduleTypeLabel.appendChild(document.createTextNode("授業："));

        const scheduleTypeSelect = document.createElement("select");
        scheduleTypeLabel.appendChild(scheduleTypeSelect);
        scheduleTypeSelect.id = "schedule-type-select";
        addSelectOption(scheduleTypeSelect, "-", "");
        addScheduleTypesToSelect(scheduleTypeSelect);

        const scheduleTypeScopeLabel = document.createElement("label");
        scheduleTypeSet.appendChild(scheduleTypeScopeLabel);
        scheduleTypeScopeLabel.appendChild(document.createTextNode("適用範囲："));

        const scheduleTypeScopeSelect = createScopeSelect();
        scheduleTypeScopeLabel.appendChild(scheduleTypeScopeSelect);
        scheduleTypeScopeSelect.id = "schedule-type-scope-select";

    // timeType
        const timeTypeSet = document.createElement("fieldset");
        scheduleEditForm.appendChild(timeTypeSet);

        const timeTypeSetLegend = document.createElement("legend");
        timeTypeSet.appendChild(timeTypeSetLegend);
        timeTypeSetLegend.appendChild(document.createTextNode("時程"));

        const timeTypeLabel = document.createElement("label");
        timeTypeSet.appendChild(timeTypeLabel);
        timeTypeLabel.appendChild(document.createTextNode("時程："));

        const timeTypeSelect = document.createElement("select");
        timeTypeSelect.id = "time-type-select";
        timeTypeLabel.appendChild(timeTypeSelect);
        addSelectOption(timeTypeSelect, "-", "");
        addTimeTypesToSelect(timeTypeSelect);

        const timeTypeScopeLabel = document.createElement("label");
        timeTypeSet.appendChild(timeTypeScopeLabel);
        timeTypeScopeLabel.appendChild(document.createTextNode("適用範囲："));

        const timeTypeScopeSelect = createScopeSelect();
        timeTypeScopeLabel.appendChild(timeTypeScopeSelect);
        timeTypeScopeSelect.id = "time-type-scope-select";

    // 授業
        /**
         * 時限の要素が格納された配列
         * @type {HTMLElement[]}
         */
        let periodElements = [];
        const createPeriodElements = period => {
            const sectionElement = document.createElement("section");
            periodElements[period - 1] = sectionElement;
            
            const header = document.createElement("h3");
            sectionElement.appendChild(header);
            header.appendChild(document.createTextNode(period + "時限目"));

            const periodScheduleTypeSet = document.createElement("fieldset");
            sectionElement.appendChild(periodScheduleTypeSet);

            const periodScheduleTypeSetLegend = document.createElement("legend");
            periodScheduleTypeSet.appendChild(periodScheduleTypeSetLegend);
            periodScheduleTypeSetLegend.appendChild(document.createTextNode("授業"));

            const periodScheduleTypeLabel = document.createElement("label");
            periodScheduleTypeSet.appendChild(periodScheduleTypeLabel);
            periodScheduleTypeLabel.appendChild(document.createTextNode("授業："));

            const periodScheduleTypeSelect = document.createElement("select");
            periodScheduleTypeLabel.appendChild(periodScheduleTypeSelect);
            periodScheduleTypeSelect.id = `period-${period}-schedule-type-select`;
            addSelectOption(periodScheduleTypeSelect, "-", "");
            addScheduleTypesToSelect(periodScheduleTypeSelect);

            const periodScheduleTypePeriodLabel = document.createElement("label");
            periodScheduleTypeSet.appendChild(periodScheduleTypePeriodLabel);
            periodScheduleTypePeriodLabel.appendChild(document.createTextNode("時限："));

            const periodScheduleTypePeriodInput = document.createElement("input");
            periodScheduleTypePeriodLabel.appendChild(periodScheduleTypePeriodInput);
            periodScheduleTypePeriodInput.id = `period-${period}-schedule-type-period-input`;
            periodScheduleTypePeriodInput.type = "number";
            periodScheduleTypePeriodInput.min = "0";

            const periodScheduleTypeScopeLabel = document.createElement("label");
            periodScheduleTypeSet.appendChild(periodScheduleTypeScopeLabel);
            periodScheduleTypeScopeLabel.appendChild(document.createTextNode("適用範囲："));

            const periodScheduleTypeScopeSelect = createScopeSelect();
            periodScheduleTypeScopeLabel.appendChild(periodScheduleTypeScopeSelect);
            periodScheduleTypeScopeSelect.id = `period-${period}-schedule-type-scope-input`;

            const periodSubjectElementsList = document.createElement("ul");
            sectionElement.appendChild(periodSubjectElementsList);
            periodSubjectElementsList.classList.add("subject-list");

            const periodAddButton = document.createElement("button");
            sectionElement.appendChild(periodAddButton);
            periodAddButton.type = "button";
            periodAddButton.appendChild(document.createTextNode("教科を追加"));

            return sectionElement;
        };
        scheduleEditForm.appendChild(createPeriodElements(1));
}

document.getElementById("schedule-edit-type").addEventListener("change", event => {
    const value = document.getElementById("schedule-edit-type").value;
    if (value == "schedule-type") {
        document.getElementById("schedule-edit-period-field").style.display = "none";
        document.getElementById("schedule-edit-schedule-type-field").style.display = "";
        document.getElementById("schedule-edit-time-type-field").style.display = "none";
        document.getElementById("schedule-edit-period-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-subject-field").style.display = "none";
        document.getElementById("schedule-edit-time-field").style.display = "none";
    } else if (value == "time-type") {
        document.getElementById("schedule-edit-period-field").style.display = "none";
        document.getElementById("schedule-edit-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-time-type-field").style.display = "";
        document.getElementById("schedule-edit-period-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-subject-field").style.display = "none";
        document.getElementById("schedule-edit-time-field").style.display = "none";
    } else if (value == "period-schedule-type") {
        document.getElementById("schedule-edit-period-field").style.display = "";
        document.getElementById("schedule-edit-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-time-type-field").style.display = "none";
        document.getElementById("schedule-edit-period-schedule-type-field").style.display = "";
        document.getElementById("schedule-edit-subject-field").style.display = "none";
        document.getElementById("schedule-edit-time-field").style.display = "none";
    } else if (value == "subject") {
        document.getElementById("schedule-edit-period-field").style.display = "";
        document.getElementById("schedule-edit-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-time-type-field").style.display = "none";
        document.getElementById("schedule-edit-period-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-subject-field").style.display = "";
        document.getElementById("schedule-edit-time-field").style.display = "none";
    } else if (value == "time") {
        document.getElementById("schedule-edit-period-field").style.display = "";
        document.getElementById("schedule-edit-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-time-type-field").style.display = "none";
        document.getElementById("schedule-edit-period-schedule-type-field").style.display = "none";
        document.getElementById("schedule-edit-subject-field").style.display = "none";
        document.getElementById("schedule-edit-time-field").style.display = "";
    }
});
document.getElementById("schedule-edit-scope-type").addEventListener("change", event => {
    const value = document.getElementById("schedule-edit-scope-type").value;
    if (value == "whole" || value == "user") {
        document.getElementById("schedule-edit-scope-grade-container").style.display = "none";
        document.getElementById("schedule-edit-scope-class-container").style.display = "none";
    } else if (value == "general") {
        document.getElementById("schedule-edit-scope-grade-container").style.display = "";
        document.getElementById("schedule-edit-scope-class-container").style.display = "none";
    } else if (value == "class") {
        document.getElementById("schedule-edit-scope-grade-container").style.display = "none";
        document.getElementById("schedule-edit-scope-class-container").style.display = "";
    }
});
document.getElementById("schedule-edit-period-add").dataset.nextPeriod = "1";
document.getElementById("schedule-edit-period-add").addEventListener("click", event => {
    const newPeriod = parseInt(document.getElementById("schedule-edit-period-add").dataset.nextPeriod);
    const newPeriodOptionElement = document.createElement("option");
    document.getElementById("schedule-edit-period").appendChild(newPeriodOptionElement);
    newPeriodOptionElement.appendChild(document.createTextNode(newPeriod + "時限目"));
    newPeriodOptionElement.value = newPeriod.toString();
    document.getElementById("schedule-edit-period").value = newPeriod.toString();
    document.getElementById("schedule-edit-period-add").dataset.nextPeriod = (newPeriod + 1).toString();
    document.getElementById("schedule-edit-period-add").textContent = (newPeriod + 1) + "時限目を追加";
});
document.getElementById("schedule-edit-subject-checkbox").addEventListener("change", event => {
    if (document.getElementById("schedule-edit-subject-checkbox").checked) {
        document.getElementById("schedule-edit-subject-select-container").style.display = "";
        document.getElementById("schedule-edit-subject-input-container").style.display = "none";
    } else {
        document.getElementById("schedule-edit-subject-select-container").style.display = "none";
        document.getElementById("schedule-edit-subject-input-container").style.display = "";
    }
});
document.getElementById("schedule-edit-time-start-delete").addEventListener("click", event => {
    document.getElementById("schedule-edit-time-start").value = "";
});
document.getElementById("schedule-edit-time-finish-delete").addEventListener("click", event => {
    document.getElementById("schedule-edit-time-finish").value = "";
});
document.getElementById("schedule-edit-form").addEventListener("submit", event => {
    /** @type {scheduleChangeKey} */
    const changeKey = {};
    const scopeType = document.getElementById("schedule-edit-scope-type").value;
    changeKey.scopeType = scopeType;
    if (scopeType == "general") {
        const scopeGrade = document.getElementById("schedule-edit-scope-grade").value;
        changeKey.scopeName = parseInt(scopeGrade);
    } else if (scopeType == "class") {
        const scopeClass = document.getElementById("schedule-edit-scope-class").value;
        changeKey.scopeName = scopeClass;
    } else if (scopeType == "user") {
        changeKey.scopeName = USER_ID;
    }
    const editDate = document.getElementById("schedule-edit-date").value;
    changeKey.date = editDate;
    const editType = document.getElementById("schedule-edit-type").value;
    if (editType == "schedule-type") {
        ;
    } else if (editType == "time-type") {
        ;
    } else if (editType == "period-schedule-type") {
        ;
    } else if (editType == "subject") {
        ;
    } else if (editType == "time") {
        ;
    }
});
/**
 * 時間割を編集するダイアログを更新する関数
 * @param {{editType?:("schedule-type"|"time-type"|"period-schedule-type"|"subject"|"time"), scopeType?:("whole"|"general"|"class"|"user"), scopeName?:string, date?:string}} [initialValue]
 */
function updateScheduleEditDialog(initialValue = {}) {
    // 編集項目
    if (initialValue.editType) {
        document.getElementById("schedule-edit-type").value = initialValue.editType;
    }
    document.getElementById("schedule-edit-type").dispatchEvent(new Event("change"));
    // 適用範囲（種類）
    if (initialValue.scopeType) {
        document.getElementById("schedule-edit-scope-type").value = initialValue.scopeType;
    } else {
        document.getElementById("schedule-edit-scope-type").value = "class";
    }
    document.getElementById("schedule-edit-scope-type").dispatchEvent(new Event("change"));
    // 適用範囲（学年）
    {
        const scheduleEditScopeGradeSelect = document.getElementById("schedule-edit-scope-grade");
        while (scheduleEditScopeGradeSelect.firstChild) {
            scheduleEditScopeGradeSelect.removeChild(scheduleEditScopeGradeSelect.firstChild);
        }
        const grades = [];
        for (let className in data.classes) {
            const grade = data.classes[className].grade;
            if (!grades.includes(grade)) grades.push(grade);
        }
        grades.sort();
        for (let i = 0; i < grades.length; i++) {
            const gradeString = grades[i].toString();
            const optionElement = document.createElement("option");
            scheduleEditScopeGradeSelect.appendChild(optionElement);
            optionElement.value = gradeString;
            optionElement.appendChild(document.createTextNode(gradeString + "年"));
        }
        if (initialValue.scopeName) {
            scheduleEditScopeGradeSelect.value = initialValue.scopeName;
        } else {
            scheduleEditScopeGradeSelect.value = data.user[USER_ID].grade.toString();
        }
    }
    // 適用範囲（クラス）
    {
        const scheduleEditScopeClassSelect = document.getElementById("schedule-edit-scope-class");
        while (scheduleEditScopeClassSelect.firstChild) {
            scheduleEditScopeClassSelect.removeChild(scheduleEditScopeClassSelect.firstChild);
        }
        const classes = [];
        for (let className in data.classes) {
            classes.push(className);
        }
        const collator = new Intl.Collator("ja");
        classes.sort((a, b) => {
            const gradeA = data.classes[a].grade;
            const gradeB = data.classes[b].grade;
            if (gradeA != gradeB) {
                return gradeA - gradeB;
            }
            return collator.compare(a, b);
        });
        for (let i = 0; i < classes.length; i++) {
            const className = classes[i];
            const optionElement = document.createElement("option");
            scheduleEditScopeClassSelect.appendChild(optionElement);
            optionElement.value = className;
            optionElement.appendChild(document.createTextNode(className));
        }
        if (initialValue.scopeName) {
            scheduleEditScopeClassSelect.value = initialValue.scopeName;
        } else {
            scheduleEditScopeClassSelect.value = data.user[USER_ID].className;
        }
    }
    // 日付
    document.getElementById("schedule-edit-date").min = TODAY_DATE_STRING;
    document.getElementById("schedule-edit-date").value = currentDate;
    // 時限
    let maxPeriod = 1;
    if (data.classes[data.user[USER_ID].className].table) {
        for (let scheduleType in data.classes[data.user[USER_ID].className].table) {
            if (!data.classes[data.user[USER_ID].className].table[scheduleType]) continue;
            let currentMaxPeriod = data.classes[data.user[USER_ID].className].table[scheduleType].schedule.length - 1;
            if (currentMaxPeriod > maxPeriod) {
                maxPeriod = currentMaxPeriod;
            }
        }
    }
    {
        const periodSelect = document.getElementById("schedule-edit-period");
        while (periodSelect.firstChild) {
            periodSelect.removeChild(periodSelect.firstChild);
        }
        for (let i = 1; i <= maxPeriod; i++) {
            const newPeriod = i;
            const newPeriodOptionElement = document.createElement("option");
            periodSelect.appendChild(newPeriodOptionElement);
            newPeriodOptionElement.appendChild(document.createTextNode(newPeriod + "時限目"));
            newPeriodOptionElement.value = newPeriod.toString();
        }
        periodSelect.value = "1";
        document.getElementById("schedule-edit-period-add").dataset.nextPeriod = (maxPeriod + 1).toString();
        document.getElementById("schedule-edit-period-add").textContent = (maxPeriod + 1) + "時限目を追加";
    }
    // 時間割
    {
        const scheduleTypeSelect = document.getElementById("schedule-edit-schedule-type");
        const periodScheduleTypeSelect = document.getElementById("schedule-edit-period-schedule-type");
        while (scheduleTypeSelect.firstChild) {
            scheduleTypeSelect.removeChild(scheduleTypeSelect.firstChild);
        }
        while (periodScheduleTypeSelect.firstChild) {
            periodScheduleTypeSelect.removeChild(periodScheduleTypeSelect.firstChild);
        }
        const scheduleTypeDeleteOption = document.createElement("option");
        const periodScheduleTypeDeleteOption = document.createElement("option");
        scheduleTypeSelect.appendChild(scheduleTypeDeleteOption);
        periodScheduleTypeSelect.appendChild(periodScheduleTypeDeleteOption);
        scheduleTypeDeleteOption.appendChild(document.createTextNode("-"));
        periodScheduleTypeDeleteOption.appendChild(document.createTextNode("-"));
        scheduleTypeDeleteOption.value = "";
        periodScheduleTypeDeleteOption.value = "";
        if (data.settings.scheduleTypeOrder) {
            for (let i = 0; i < data.settings.scheduleTypeOrder.length; i++) {
                if (!data.settings.scheduleTypeOrder[i]) continue;
                const scheduleTypeOption = document.createElement("option");
                const periodScheduleTypeOption = document.createElement("option");
                scheduleTypeSelect.appendChild(scheduleTypeOption);
                periodScheduleTypeSelect.appendChild(periodScheduleTypeOption);
                scheduleTypeOption.appendChild(document.createTextNode(data.settings.scheduleTypeOrder[i]));
                periodScheduleTypeOption.appendChild(document.createTextNode(data.settings.scheduleTypeOrder[i]));
                scheduleTypeOption.value = data.settings.scheduleTypeOrder[i];
                periodScheduleTypeOption.value = data.settings.scheduleTypeOrder[i];
            }
        }
    }
    // 時程
    {
        const timeTypeSelect = document.getElementById("schedule-edit-time-type");
        while (timeTypeSelect.firstChild) {
            timeTypeSelect.removeChild(timeTypeSelect.firstChild);
        }
        const timeTypeNoneOption = document.createElement("option");
        timeTypeSelect.appendChild(timeTypeNoneOption);
        timeTypeNoneOption.appendChild(document.createTextNode("-"));
        timeTypeNoneOption.value = "";
        if (data.settings.timeTypeOrder) {
            for (let i = 0; i <= data.settings.timeTypeOrder.length; i++) {
                if (!data.settings.timeTypeOrder[i]) continue;
                const timeTypeOption = document.createElement("option");
                timeTypeSelect.appendChild(timeTypeOption);
                timeTypeOption.appendChild(document.createTextNode(data.settings.timeTypeOrder[i]));
                timeTypeOption.value = data.settings.timeTypeOrder[i];
            }
        }
    }
    // 時間割の時限
    {
        const periodScheduleTypePeriodSelect = document.getElementById("schedule-edit-period-schedule-type-period");
        while (periodScheduleTypePeriodSelect.firstChild) {
            periodScheduleTypePeriodSelect.removeChild(periodScheduleTypePeriodSelect.firstChild);
        }
        const periodScheduleTypePeriodNoneOption = document.createElement("option");
        periodScheduleTypePeriodSelect.appendChild(periodScheduleTypePeriodNoneOption);
        periodScheduleTypePeriodNoneOption.appendChild(document.createTextNode("-"));
        periodScheduleTypePeriodNoneOption.value = "";
        for (let i = 1; i <= maxPeriod; i++) {
            const periodScheduleTypePeriodOption = document.createElement("option");
            periodScheduleTypePeriodSelect.appendChild(periodScheduleTypePeriodOption);
            periodScheduleTypePeriodOption.appendChild(document.createTextNode(i + "時限目"));
            periodScheduleTypePeriodOption.value = i.toString();
        }
    }
    // 教科 > チェックボックス
    document.getElementById("schedule-edit-subject-checkbox").checked = true;
    document.getElementById("schedule-edit-subject-checkbox").dispatchEvent(new Event("change"));
    // 教科 > プルダウン
    {
        const subjectSelect = document.getElementById("schedule-edit-subject-select");
        while (subjectSelect.firstChild) {
            subjectSelect.removeChild(subjectSelect.firstChild);
        }
        const subjects = getAllSubjects(USER_ID);
        if (subjects.length > 0) {
            for (let i = 0; i < subjects.length; i++) {
                const subjectOption = document.createElement("option");
                subjectSelect.appendChild(subjectOption);
                subjectOption.appendChild(document.createTextNode(subjects[i]));
                subjectOption.value = subjects[i];
            }
        } else {
            const subjectOption = document.createElement("option");
            subjectSelect.appendChild(subjectOption);
            subjectOption.appendChild(document.createTextNode("選択できる教科がありません。"));
            subjectOption.value = "";
        }
    }
}

function updateContentsEditDialog() {}

/**
 * 日付を更新する関数
 * @param {string} dateString - 日付を表す文字列（yyyy-MM-dd）
 */
function updateCurrentDate(dateString = currentDate) {
    currentDate = dateString;
    sessionStorage.setItem("currentDate", currentDate);
    const dateObject = dateStringToDate(dateString);
    let displayString = (dateObject.getMonth() + 1) + "月" + dateObject.getDate() + "日" + " (" + DAY_NAME[dateObject.getDay()] + ")";
    document.getElementById("date").textContent = displayString;
    document.getElementById("last-day").disabled = false;
    if (dateString == TODAY_DATE_STRING) {
        const spanElement = document.createElement("span");
        document.getElementById("date").appendChild(spanElement);
        spanElement.appendChild(document.createTextNode(" ：今日"));
        document.getElementById("last-day").disabled = true;
    } else if (dateString == TOMORROW_DATE_STRING) {
        const spanElement = document.createElement("span");
        document.getElementById("date").appendChild(spanElement);
        spanElement.appendChild(document.createTextNode(" ：明日"));
    }
    createDateTable(dateObject);

    updateSchedule();
}


document.getElementById("last-day").addEventListener("click", event => {
    const dateObject = dateStringToDate(currentDate);
    dateObject.setDate(dateObject.getDate() - 1);
    updateCurrentDate(dateToString(dateObject));
});
document.getElementById("next-day").addEventListener("click", event => {
    const dateObject = dateStringToDate(currentDate);
    dateObject.setDate(dateObject.getDate() + 1);
    updateCurrentDate(dateToString(dateObject));
});
document.getElementById("today").addEventListener("click", event => {
    const dateObject = new Date();
    updateCurrentDate(dateToString(dateObject));
});

document.getElementById("date-table-last-month").addEventListener("click", event => {
    createDateTable(new Date(dateTableYear, dateTableMonth - 1));
});
document.getElementById("date-table-next-month").addEventListener("click", event => {
    createDateTable(new Date(dateTableYear, dateTableMonth + 1));
});

document.getElementById("show-menu").addEventListener("click", event => {
    document.getElementById("menu").showModal();
});
document.getElementById("menu-dialog-close").addEventListener("click", event => {
    document.getElementById("menu").close();
});
document.getElementById("schedule-edit-dialog-menu").addEventListener("click", event => {
    document.getElementById("schedule-edit-dialog").showModal();
    updateScheduleEditDialog();
});
document.getElementById("contsnts-edit-dialog-menu").addEventListener("click", event => {
    document.getElementById("contsnts-edit-dialog").showModal();
    updateContentsEditDialog();
});

document.getElementById("schedule-edit-dialog-close").addEventListener("click", event => {
    document.getElementById("schedule-edit-dialog").close();
});

document.getElementById("contsnts-edit-dialog-close").addEventListener("click", event => {
    document.getElementById("contsnts-edit-dialog").close();
});


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
}