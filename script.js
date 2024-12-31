/**
 * 曜日を表す文字列
 * @type {string[]}
 */
const DAY_NAME = ["日", "月", "火", "水", "木", "金", "土"];

const USER_ID = "U173f0ed6c8b9c6ab4483090bb1383f50";
const API_URL = "https://script.google.com/macros/s/AKfycbx3O3xd2_cIFth8UBldkZIsi5qveYAUsD_QjCSeRuEiafW34Cv7LZLsWWDYzoC0iu9IPg/exec";

/**
 * 現在表示している日
 * @type {string}
 */
let currentDate;

/**
 * データを取得
 * @param {(data:schoolScheduleData)} callback データを取得した後に実行する関数
 */
function getData(callback) {
    const request = new XMLHttpRequest();
    request.addEventListener('load', event => {callback(JSON.parse(event.target.responseText))});
    request.open("GET", API_URL);
    request.send();
}
getData(responseData => {
    console.log(responseData);
    data = responseData;
    updateCurrentDate(dateToString(new Date()));
});

/**
 * date-tableを作成する関数
 * @param {Date} date カレンダーに含む日
 */
function createDateTable(date) {
    const selectedDateString = dateToString(date);
    const _date = new Date(date);
    const month = _date.getMonth();
    _date.setDate(1);
    if (_date.getDay() <= 1) {
        _date.setDate(_date.getDate() - 7);  // 月が月曜日又は火曜日で始まる場合、一週間前から表示
    }
    _date.setDate(_date.getDate() - _date.getDay());  // 日曜日に設定

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
            if (dateString == selectedDateString) dateTableData.className = "selected";

            const dateButton = document.createElement("button");
            dateTableData.appendChild(dateButton);
            dateButton.appendChild(document.createTextNode(_date.getDate().toString()));
            if (_date.getMonth() != month) dateButton.style.color = "#999999";

            dateButton.addEventListener("click", event => {
                updateCurrentDate(dateString);
            });
            
            _date.setDate(_date.getDate() + 1);
        }
    }
}

/**
 * 日付を更新する関数
 * @param {string} dateString 日付を表す文字列（yyyy-MM-dd）
 */
function updateCurrentDate(dateString) {
    currentDate = dateString;
    const dateObject = new Date(dateString);
    document.getElementById("date").textContent = (dateObject.getMonth() + 1) + "月" + dateObject.getDate() + "日" + "（" + DAY_NAME[dateObject.getDay()] + "）"
    createDateTable(dateObject);

    const scheduleElement = document.createElement("div");
    document.getElementById("schedule").replaceWith(scheduleElement);
    scheduleElement.id = "schedule";

    let currentSchedule = getSchedule(dateString, USER_ID);
    if (currentSchedule.schedule.length > 1) {
        for (let period = 1; period < currentSchedule.schedule.length; period++) {
            const currentPeriod = currentSchedule.schedule[period];
            if (!currentPeriod) continue;
            const periodHeader = document.createElement("h3");
            scheduleElement.appendChild(periodHeader);
            periodHeader.appendChild(document.createTextNode(`${period}時限目`));
    
            for (let index = 0; index < currentPeriod.length; index++) {
                const subject = currentPeriod[index];
                if (!subject || !subject.subject) continue;
                const subjectHeadr = document.createElement("h4");
                scheduleElement.appendChild(subjectHeadr);
                subjectHeadr.appendChild(document.createTextNode(`${subject.subject}`))
                if (subject.time) {
                    const timeElement = document.createElement("div");
                    scheduleElement.appendChild(timeElement);
                    timeElement.className = "time";
                    timeElement.appendChild(document.createTextNode(`${subject.time}`));
                }
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
    } else {
        const noClassElement = document.createElement("p");
        scheduleElement.appendChild(noClassElement);
        noClassElement.appendChild(document.createTextNode(`授業はありません`));
    }
}

let is_dateTableShowed = true;
document.getElementById("date").addEventListener("click", event => {
    is_dateTableShowed = !is_dateTableShowed;
    if (is_dateTableShowed) {
        document.getElementById("date-table").style.display = "";
    } else {
        document.getElementById("date-table").style.display = "none";
    }
});


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
}