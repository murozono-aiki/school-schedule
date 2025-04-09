/**
 * @typedef {object} editChange
 * @property {"edit"} method
 * @property {string} key
 * @property {string} [editValue] 配列の場合
 * @property {string} value
 */
/**
 * @typedef {object} addChange
 * @property {"add"} method
 * @property {string} key
 * @property {string} value
 */
/**
 * @typedef {object} deleteChange
 * @property {"delete"} method
 * @property {string} key
 * @property {string} deleteValue
 */
/**
 * @typedef {object} structuredChange
 * @property {"structuredChange"} method
 * @property {string} key
 * @property {number} [period] 配列の場合
 * @property {editChange | addChange | deleteChange | structuredChange} change
 */
/**
 * @typedef {object} scheduleChangeKey
 * @property {"whole" | "general" | "class" | "user"} scopeType
 * @property {number | string} [scopeName]
 * @property {string} date
 */
/**
 * @typedef {object} scheduleChangeData
 * @property {"schedule"} type
 * @property {scheduleChangeKey} key
 * @property {(editChange | addChange | deleteChange | structuredChange)[]} changes
 */
/**
 * @typedef {object} dateContentChangeKey
 * @property {"date"} contentType
 * @property {"whole" | "general" | "class" | "user"} scopeType
 * @property {number | string} [scopeName]
 * @property {string} date
 * @property {number} [period]
 * @property {string} subject
 */
/**
 * @typedef {object} dateContentChangeData
 * @property {"content"} type
 * @property {dateContentChangeKey} key
 * @property {(editChange | addChange | deleteChange)[]} changes
 */
/**
 * @typedef {object} timesContentChangeKey
 * @property {"times"} contentType
 * @property {"whole" | "general" | "class" | "user"} scopeType
 * @property {number | string} [scopeName]
 * @property {number} times
 * @property {string} [userId]
 * @property {string} subject
 */
/**
 * @typedef {object} timesContentChangeData
 * @property {"content"} type
 * @property {timesContentChangeKey} key
 * @property {(editChange | addChange | deleteChange)[]} changes
 */
/**
 * @typedef {dateContentChangeData | timesContentChangeData} contentChangeData
 */
/**
 * @typedef {object} userChangeKey
 * @property {string} userId
 */
/**
 * @typedef {object} userChangeData
 * @property {"user"} type
 * @property {userChangeKey} key
 * @property {(editChange | addChange | deleteChange | structuredChange)[]} changes
 */
/**
 * @typedef {object} classesChangeKey
 * @property {string} name
 */
/**
 * @typedef {object} classesChangeData
 * @property {"classes"} type
 * @property {classesChangeKey} key
 * @property {(editChange | addChange | deleteChange | structuredChange)[]} changes
 */
/**
 * @typedef {object} schoolChangeData
 * @property {"school"} type
 * @property {(editChange | addChange | deleteChange | structuredChange)[]} changes
 */
/**
 * @typedef {object} settingsChangeData
 * @property {"settings"} type
 * @property {(editChange | addChange | deleteChange | structuredChange)[]} changes
 */
/**
 * @typedef {(scheduleChangeData | contentChangeData | userChangeData | classesChangeData | schoolChangeData | settingsChangeData)[]} changeData
 */

/**
 * @typedef {Object} scopeObject
 * @property {"whole" | "general" | "class" | "user"} scopeType
 * @property {number | string} [name]
 */
/**
 * @typedef {Object} scheduleData
 * @property {number} key
 * @property {scopeObject} scope
 * @property {string} date
 * @property {string | "[not inherit]"} [scheduleType]
 * @property {string} [timeType]
 * @property {{scheduleType:string, period?:number}[]} [periodScheduleType]
 * @property {{period:number, subject?:string[], time?:{startTime?:string, finishTime?:string}}[]} [contents]
 */
/**
 * @typedef {Object} dateContentData
 * @property {number} key
 * @property {scopeObject} scope
 * @property {"date"} contentType
 * @property {string} date
 * @property {number} [period]
 * @property {string} subject
 * @property {string[]} [homework]
 * @property {string[]} [submit]
 * @property {string[]} [bring]
 * @property {string[]} [event]
 * @property {string[]} [note]
 * @property {{startTime?:string, finishTime?:string}} [time]
 */
/**
 * @typedef {Object} timesContentData
 * @property {number} key
 * @property {scopeObject} scope
 * @property {"times"} contentType
 * @property {number} times
 * @property {string} [userId]
 * @property {string} subject
 * @property {string[]} [homework]
 * @property {string[]} [submit]
 * @property {string[]} [bring]
 * @property {string[]} [event]
 * @property {string[]} [note]
 * @property {{startTime?:string, finishTime?:string}} [time]
 */
/**
 * @typedef {Object} userData
 * @property {string} userId
 * @property {number} grade
 * @property {string} className
 * @property {{select:string[], notSelect:string[]}} selectClass
 */
/**
 * @typedef {Object} classData
 * @property {string} name
 * @property {number} grade
 * @property {{[scheduleType:string]:{scheduleType:string, schedule:{ subject:string[], userSetting?:{[userId:string]:{userId:string, subject:string[]}}}[]}}} table
 */
/**
 * @typedef {Object} schoolData
 * @property {{[timeType:string]:{timeType:string, time:{startTime:string, finishTime:string}[]}}} timeTable
 */
/**
 * @typedef {Object} settingsData
 * @property {{[startDate:string]:{startDate:string, schedules:{[afterScheduleType:string]:{beforeScheduleType:string, afterScheduleType:string}}}}} tableSchedule
 * @property {string[]} scheduleTypeOrder
 * @property {string[]} timeTypeOrder
 */
/**
 * @typedef {Object} schoolScheduleData
 * @property {scheduleData[]} schedule
 * @property {(dateContentData | timesContentData)[]} contents
 * @property {{[userId:userData["userId"]]:userData}} user
 * @property {{[name:classData["name"]]:classData}} classes
 * @property {schoolData} school
 * @property {settingsData} settings
 */

/** @type {schoolScheduleData} */
let data;


/**
 * クラスの特定の日の時間割を取得する
 * @param {string} date - 日付（yyyy-MM-dd）
 * @param {string} className - クラス名
 */
function getClassTableFromDate(date, className) {
  if (!data.classes[className] || !data.classes[className].table) return null;
  /** @type {classData["table"]} */
  const result = data.classes[className].table;
  if (data.settings.tableSchedule) {
    const dateObject = dateStringToDate(date);
    const tableScheduleDates = Object.keys(data.settings.tableSchedule);
    const tableScheduleDateObjects = tableScheduleDates.map(value => dateStringToDate(value));
    tableScheduleDateObjects.sort((a, b) => a.getTime() - b.getTime());
    for (let i = 0; i < tableScheduleDateObjects.length; i++) {
      if (tableScheduleDateObjects[i].getTime() > dateObject.getTime()) break;
      const tableScheduleObject = data.settings.tableSchedule[dateToString(tableScheduleDateObjects[i])].schedules;
      for (let afterScheduleType in tableScheduleObject) {
        let beforeScheduleType = tableScheduleObject[afterScheduleType].beforeScheduleType;
        result[afterScheduleType] = data.classes[className].table[beforeScheduleType];
        result[afterScheduleType].scheduleType = afterScheduleType;
      }
    }
  }
  return result;
}

/**
 * 1日の時間割に係るscheduleを取得する
 * @param {string} date - 日付（yyyy-MM-dd）
 * @param {string} userId - ユーザーid
 * @return {{whole:scheduleData, general:scheduleData, class:scheduleData, user:scheduleData}}
 */
function getOneDaySchedules(date, userId) {
  const userData = data.user[userId];
  const grade = userData.grade;
  const className = userData.className;
  let wholeSchedule = {};  // 学校全体での予定
  let generalSchedule = {};  // 学年全体での予定
  let classSchedule = {};  // クラスの予定
  let userSchedule = {};  // 個人が設定した予定
  // データから予定を取得
  for (let schedule of data.schedule) {
    if (!schedule) continue;
    if (schedule.date == date) {
      if (schedule.scope.scopeType == "whole") {
        wholeSchedule = data.schedule[schedule.key];
      } else if (schedule.scope.scopeType == "general" && schedule.scope.name == grade) {
        generalSchedule = data.schedule[schedule.key];
      } else if (schedule.scope.scopeType == "class" && schedule.scope.name == className) {
        classSchedule = data.schedule[schedule.key];
      } else if (schedule.scope.scopeType == "user" && schedule.scope.name == userId) {
        userSchedule = data.schedule[schedule.key];
      }
    }
  }
  return {
    whole: wholeSchedule,
    general: generalSchedule,
    class: classSchedule,
    user: userSchedule
  };
}

/**
 * クラスの1日の教科のリストを取得する
 * @param {string} date - 日付（yyyy-MM-dd）
 * @param {string} className - クラス名
 * @param {string} [userId=undefined] - ユーザーid
 * @return {{subject:string[],scheduleType:{scheduleType:string,period:number},time:{startTime:string,finishTime:string}}[]}
 */
function getClassSubjects(date, className, userId = undefined) {
  const grade = data.classes[className].grade;
  const classTable = getClassTableFromDate(date, className);
  /** @type {scheduleData} */
  let wholeSchedule = {};  // 学校全体での予定
  /** @type {scheduleData} */
  let generalSchedule = {};  // 学年全体での予定
  /** @type {scheduleData} */
  let classSchedule = {};  // クラスの予定
  // データから予定を取得
  for (let schedule of data.schedule) {
    if (!schedule) continue;
    if (schedule.date == date) {
      if (schedule.scope.scopeType == "whole") {
        wholeSchedule = data.schedule[schedule.key];
      } else if (schedule.scope.scopeType == "general" && schedule.scope.name == grade) {
        generalSchedule = data.schedule[schedule.key];
      } else if (schedule.scope.scopeType == "class" && schedule.scope.name == className) {
        classSchedule = data.schedule[schedule.key];
      }
    }
  }
  /**
   * @type {{subject:string[],scheduleType:{scheduleType:string,period:number},time:{startTime:string,finishTime:string}}[]}
   */
  const result = [];
  const objects = [wholeSchedule, generalSchedule, classSchedule];
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    if (object.scheduleType) {
      if (object.scheduleType == "[not inherit]") {
        for (let j = 0; j < result.length; j++) {
          if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
          result[j].subject = [];
          result[j].scheduleType = {};
        }
      } else if (classTable) {
        if (classTable[object.scheduleType] && classTable[object.scheduleType].schedule) {
          const schedule = classTable[object.scheduleType].schedule;
          for (let j = 0; j < schedule.length; j++) {
            if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
            if (schedule[j]) {
              if (schedule[j].subject) {
                result[j].subject = schedule[j].subject;
                result[j].scheduleType.scheduleType = object.scheduleType;
                result[j].scheduleType.period = j;
              }
              if (userId) {
                if (schedule[j].userSetting && schedule[j].userSetting[userId]) {
                  if (schedule[j].userSetting[userId].subject) {
                    result[j].subject = schedule[j].userSetting[userId].subject;
                    result[j].scheduleType.scheduleType = object.scheduleType;
                    result[j].scheduleType.period = j;
                  }
                }
              }
            }
          }
        }
      }
    }
    if (object.timeType) {
      if (data.school.timeTable) {
        if (data.school.timeTable[object.timeType] && data.school.timeTable[object.timeType].time) {
          const time = data.school.timeTable[object.timeType].time;
          for (let j = 0; j < time.length; j++) {
            if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
            if (time[j]) {
              if (time[j].startTime) {
                result[j].time.startTime = time[j].startTime;
              }
              if (time[j].finishTime) {
                result[j].time.finishTime = time[j].finishTime;
              }
            }
          }
        }
      }
    }
    if (object.periodScheduleType) {
      for (let j = 0; j < object.periodScheduleType.length; j++) {
        if (!object.periodScheduleType[j]) continue;
        if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
        const scheduleType_ = object.periodScheduleType[j].scheduleType || object.scheduleType;
        const period_ = object.periodScheduleType[j].period || j;
        if (classTable) {
          if (classTable[scheduleType_] && classTable[scheduleType_].schedule) {
            const schedule = classTable[scheduleType_].schedule;
            if (schedule[period_]) {
              if (schedule[period_].subject) {
                result[j].subject = schedule[period_].subject;
                result[j].scheduleType.scheduleType = scheduleType_;
                result[j].scheduleType.period = period_;
              }
              if (schedule[period_].userSetting && schedule[period_].userSetting[userId]) {
                if (schedule[period_].userSetting[userId].subject) {
                  result[j].subject = schedule[period_].userSetting[userId].subject;
                  result[j].scheduleType.scheduleType = scheduleType_;
                  result[j].scheduleType.period = period_;
                }
              }
            }
          }
        }
      }
    }
    if (object.contents) {
      for (let j = 0; j < object.contents.length; j++) {
        if (!object.contents[j]) continue;
        if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
        if (object.contents[j].subject && object.contents[j].subject.some(value => value)) {
          result[j].subject = object.contents[j].subject.filter(value => value);
          result[j].scheduleType = {};
        }
        if (object.contents[j].time) {
          if (object.contents[j].time.startTime) result[j].time.startTime = object.contents[j].time.startTime;
          if (object.contents[j].time.finishTime) result[j].time.finishTime = object.contents[j].time.finishTime;
        }
      }
    }
  }
  for (let j = 0; j < result.length; j++) {
    if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
  }
  return result;
}

/**
 * 1日の教科のリストを取得する
 * @param {string} date - 日付（yyyy-MM-dd）
 * @param {string} userId - ユーザーid
 * @return {{subject:string[],scheduleType:{scheduleType:string,period:number},time:{startTime:string,finishTime:string}}[]}
 */
function getSubjects(date, userId) {
  const userData = data.user[userId];
  const className = userData.className;
  const classTable = getClassTableFromDate(date, className);
  /** @type {scheduleData} */
  let userSchedule = {};  // 個人が設定した予定
  // データから予定を取得
  for (let schedule of data.schedule) {
    if (!schedule) continue;
    if (schedule.date == date) {
      if (schedule.scope.scopeType == "user" && schedule.scope.name == userId) {
        userSchedule = data.schedule[schedule.key];
      }
    }
  }

  const result = getClassSubjects(date, className, userId);

  if (userData.selectClass) {
    for (let i = 0; i < result.length; i++) {
      if (!result[i].subject) continue;
      const selectSubjects = [];
      const otherSubjects = [];
      for (let j = 0; j < result[i].subject.length; j++) {
        if (userData.selectClass.select && userData.selectClass.select.includes(result[i].subject[j])) {
          selectSubjects.push(result[i].subject[j]);
        } else if (!userData.selectClass.notSelect || !userData.selectClass.notSelect.includes(result[i].subject[j])) {
          otherSubjects.push(result[i].subject[j]);
        }
      }
      result[i].subject = selectSubjects.concat(otherSubjects);
    }
  }

  if (userSchedule.scheduleType) {
    if (userSchedule.scheduleType == "[not inherit]") {
      for (let i = 0; i < result.length; i++) {
        if (!result[i]) result[i] = {subject: [], scheduleType: {}, time: {}};
        result[i].subject = [];
        result[i].scheduleType = {};
      }
    } else if (classTable) {
      if (classTable[userSchedule.scheduleType] && classTable[userSchedule.scheduleType].schedule) {
        const schedule = classTable[userSchedule.scheduleType].schedule;
        for (let i = 0; i < schedule.length; i++) {
          if (!result[i]) result[i] = {subject: [], scheduleType: {}, time: {}};
          if (schedule[i]) {
            if (schedule[i].subject) {
              result[i].subject = schedule[i].subject;
              result[i].scheduleType.scheduleType = userSchedule.scheduleType;
              result[i].scheduleType.period = i;
            }
            if (schedule[i].userSetting && schedule[i].userSetting[userId]) {
              if (schedule[i].userSetting[userId].subject) {
                result[i].subject = schedule[i].userSetting[userId].subject;
                result[i].scheduleType.scheduleType = userSchedule.scheduleType;
                result[i].scheduleType.period = i;
              }
            }
          }
        }
      }
    }
  }
  if (userSchedule.timeType) {
    if (data.school.timeTable) {
      if (data.school.timeTable[userSchedule.timeType] && data.school.timeTable[userSchedule.timeType].time) {
        const time = data.school.timeTable[userSchedule.timeType].time;
        for (let j = 0; j < time.length; j++) {
          if (!result[j]) result[j] = {subject: [], scheduleType: {}, time: {}};
          if (time[j]) {
            if (time[j].startTime) {
              result[j].time.startTime = time[j].startTime;
            }
            if (time[j].finishTime) {
              result[j].time.finishTime = time[j].finishTime;
            }
          }
        }
      }
    }
  }
  if (userSchedule.periodScheduleType) {
    for (let i = 0; i < userSchedule.periodScheduleType.length; i++) {
      if (!userSchedule.periodScheduleType[i]) continue;
      if (!result[i]) result[i] = {subject: [], scheduleType: {}, time: {}};
      const scheduleType_ = userSchedule.periodScheduleType[i].scheduleType || userSchedule.scheduleType;
      const period_ = userSchedule.periodScheduleType[i].period || i;
      if (classTable) {
        if (classTable[scheduleType_] && classTable[scheduleType_].schedule) {
          const schedule = classTable[scheduleType_].schedule;
          if (schedule[period_]) {
            if (schedule[period_].subject) {
              result[i].subject = schedule[period_].subject;
              result[i].scheduleType.scheduleType = scheduleType_;
              result[i].scheduleType.period = period_;
            }
            if (schedule[period_].userSetting && schedule[period_].userSetting[userId]) {
              if (schedule[period_].userSetting[userId].subject) {
                result[i].subject = schedule[period_].userSetting[userId].subject;
                result[i].scheduleType.scheduleType = scheduleType_;
                result[i].scheduleType.period = period_;
              }
            }
          }
        }
      }
    }
  }
  if (userSchedule.contents) {
    for (let i = 0; i < userSchedule.contents.length; i++) {
      if (!userSchedule.contents[i]) continue;
      if (!result[i]) result[i] = {subject: [], scheduleType: {}, time: {}};
      if (userSchedule.contents[i].subject && userSchedule.contents[i].subject.some(value => value)) {
        result[i].subject = userSchedule.contents[i].subject.filter(value => value);
        result[i].scheduleType = {};
      }
      if (userSchedule.contents[i].time) {
        if (userSchedule.contents[i].time.startTime) result[i].time.startTime = userSchedule.contents[i].time.startTime;
        if (userSchedule.contents[i].time.finishTime) result[i].time.finishTime = userSchedule.contents[i].time.finishTime;
      }
    }
  }
  return result;
}

/**
 * 1日の時間割に係るcontentsを取得する
 * @param {string} date - 日付（yyyy-MM-dd）
 * @param {string} userId - ユーザーid
 * @return {{whole:(dateContentData|timesContentData)[], general:(dateContentData|timesContentData)[], class:(dateContentData|timesContentData)[], user:(dateContentData|timesContentData)[]}[]}
 */
function getOneDayContents(date, userId) {
  function getTimes(date, subject, subjectFunction) {
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    if (currentDate.getTime() > dateStringToDate(date).getTime()) return 0;
    let count = 0;
    currentDate.setDate(currentDate.getDate() - 1);
    while (dateToString(currentDate) != date) {
      currentDate.setDate(currentDate.getDate() + 1);
      /**
       * @type {{subject:string[],scheduleType:{scheduleType:string,period:number},time:{startTime:string,finishTime:string}}[]}
       */
      const currentSubjects = subjectFunction(dateToString(currentDate));
      for (let i = 1; i < currentSubjects.length; i++) {
        if (!currentSubjects[i] || !currentSubjects[i].subject) continue;
        if (currentSubjects[i].subject.includes(subject)) count++;
      }
    }
    return count;
  }

  const userData = data.user[userId];
  const userGrade = userData.grade;
  const className = userData.className;

  const subjects = getSubjects(date, userId);
  const subjectPeriod = {};
  for (let i = 0; i < subjects.length; i++) {
    if (!subjects[i]) subjects[i] = {};
    if (!subjects[i].subject) subjects[i].subject = [];
    for (let j = 0; j < subjects[i].subject.length; j++) {
      if (i != 0) {
        if (!subjectPeriod[subjects[i].subject[j]]) subjectPeriod[subjects[i].subject[j]] = [];
        subjectPeriod[subjects[i].subject[j]].push(i);
      }
    }
  }

  const result = [];
  
  const times = {};
  let subjectFunction_class = (date_) => getClassSubjects(date_, className);
  for (let content of data.contents) {
    if (!content) continue;
    
    const scopeType = content.scope.scopeType;
    const scopeName = content.scope.name;

    let is_contein = false;
    let period;
    if (scopeType == "whole") {
      if (content.date == date) {
        if (content.period === 0) {
          is_contein = true;
          period = 0;
        } else if (content.period && (subjectPeriod[content.subject] && subjectPeriod[content.subject].includes(content.period))) {
          is_contein = true;
          period = content.period;
        } else if (content.period === undefined && (subjectPeriod[content.subject] && subjectPeriod[content.subject][0])) {
          is_contein = true;
          period = subjectPeriod[content.subject][0];
        }
      }
    } else if (scopeType == "general" && scopeName == userGrade) {
      if (content.date == date) {
        if (content.period === 0) {
          is_contein = true;
          period = 0;
        } else if (content.period && (subjectPeriod[content.subject] && subjectPeriod[content.subject].includes(content.period))) {
          is_contein = true;
          period = content.period;
        } else if (content.period === undefined && (subjectPeriod[content.subject] && subjectPeriod[content.subject][0])) {
          is_contein = true;
          period = subjectPeriod[content.subject][0];
        }
      }
    } else if (scopeType == "class" && scopeName == className) {
      if (content.contentType == "date" && content.date == date) {
        if (content.period === 0) {
          is_contein = true;
          period = 0;
        } else if (content.period && (subjectPeriod[content.subject] && subjectPeriod[content.subject].includes(content.period))) {
          is_contein = true;
          period = content.period;
        } else if (content.period === undefined && (subjectPeriod[content.subject] && subjectPeriod[content.subject][0])) {
          is_contein = true;
          period = subjectPeriod[content.subject][0];
        }
      } else if (content.contentType == "times") {
        if (!content.userId) {
          if (subjectPeriod[content.subject] && subjectPeriod[content.subject][0]) {
            let time;
            if (times[content.subject] !== undefined) {
              time = times[content.subject];
            } else {
              time = getTimes(date, content.subject, subjectFunction_class);
              times[content.subject] = time;
            }
            if (time - subjectPeriod[content.subject].length < content.times && content.times <= time) {
              is_contein = true;
              period = subjectPeriod[content.subject][subjectPeriod[content.subject].length - 1 + content.times - time];
            }
          }
        } else {
          let subjectFunction_user = (date_) => getSubjects(date_, content.userId);

          if (subjectPeriod[content.subject] && subjectPeriod[content.subject][0]) {
            // この時間割の授業が今日から何回後の授業か求める
            let time;
            time = getTimes(date, content.subject, subjectFunction_user);
            // content.userIdの教科の授業を取得し、加工
            const subjects_user = getSubjects(date, content.userId);
            const subjectPeriod_user = {};
            for (let i = 0; i < subjects_user.length; i++) {
              for (let j = 0; j < subjects_user[i].subject.length; j++) {
                if (i != 0) {
                  if (!subjectPeriod_user[subjects_user[i].subject[j]]) subjectPeriod_user[subjects_user[i].subject[j]] = [];
                  subjectPeriod_user[subjects_user[i].subject[j]].push(i);
                }
              }
            }
            // contentがこの時間割に含まれるか判断
            if (time - subjectPeriod_user[content.subject].length < content.times && content.times <= time) {
              is_contein = true;
              period = subjectPeriod_user[content.subject][subjectPeriod_user[content.subject].length - 1 + content.times - time];
              if (!subjectPeriod[content.subject] || !subjectPeriod[content.subject].includes(period)) {
                is_contein = false;
                period = undefined;
              }
            }
          }
        }
      }
    } else if (scopeType == "user" && scopeName == userId) {
      if (content.contentType == "date" && content.date == date) {
        if (content.period === 0) {
          is_contein = true;
          period = 0;
        } else if (content.period && (subjectPeriod[content.subject] && subjectPeriod[content.subject].includes(content.period))) {
          is_contein = true;
          period = content.period;
        } else if (content.period === undefined && (subjectPeriod[content.subject] && subjectPeriod[content.subject][0])) {
          is_contein = true;
          period = subjectPeriod[content.subject][0];
        }
      } else if (content.contentType == "times") {
        if (!content.userId) {
          if (subjectPeriod[content.subject] && subjectPeriod[content.subject][0]) {
            let time;
            if (times[content.subject] !== undefined) {
              time = times[content.subject];
            } else {
              time = getTimes(date, content.subject, subjectFunction_class);
              times[content.subject] = time;
            }
            if (time - subjectPeriod[content.subject].length < content.times && content.times <= time) {
              is_contein = true;
              period = subjectPeriod[content.subject][subjectPeriod[content.subject].length - 1 + content.times - time];
            }
          }
        } else {
          let subjectFunction_user = (date_) => getSubjects(date_, content.userId);

          if (subjectPeriod[content.subject] && subjectPeriod[content.subject][0]) {
            // この時間割の授業が今日から何回後の授業か求める
            let time;
            time = getTimes(date, content.subject, subjectFunction_user);
            // content.userIdの教科の授業を取得し、加工
            const subjects_user = getSubjects(date, content.userId);
            const subjectPeriod_user = {};
            for (let i = 0; i < subjects_user.length; i++) {
              for (let j = 0; j < subjects_user[i].subject.length; j++) {
                if (i != 0) {
                  if (!subjectPeriod_user[subjects_user[i].subject[j]]) subjectPeriod_user[subjects_user[i].subject[j]] = [];
                  subjectPeriod_user[subjects_user[i].subject[j]].push(i);
                }
              }
            }
            // contentがこの時間割に含まれるか判断
            if (time - subjectPeriod_user[content.subject].length < content.times && content.times <= time) {
              is_contein = true;
              period = subjectPeriod_user[content.subject][subjectPeriod_user[content.subject].length - 1 + content.times - time];
              if (!subjectPeriod[content.subject] || !subjectPeriod[content.subject].includes(period)) {
                is_contein = false;
                period = undefined;
              }
            }
          }
        }
      }
    }

    if (is_contein) {
      if (!result[period]) result[period] = {"whole":[], "general":[], "class":[], "user":[]};
      result[period][scopeType].push(content);
    }
  }

  return result;
}

/**
 * 1日の時間割を取得する
 * @param {string} date - 日付（yyyy-MM-dd）
 * @param {string} userId - ユーザーid
 * @return {{schedule:{subject:string,time:string,homework:string[],submit:string[],bring:string[],event:string[],note:string[]}[][],scheduleType:string}}
 */
function getSchedule(date, userId) {
  /**
   * @type {{schedule:{subject:string,time:string,homework:string[],submit:string[],bring:string[],event:string[],note:string[]}[][],scheduleType:string}}
   */
  const result = {schedule: [], scheduleType: ""};
  
  const subjects = getSubjects(date, userId);
  const subjectPeriod = {};
  for (let i = 0; i < (subjects.length || 1); i++) {
    result.schedule[i] = [];
    if (!subjects[i]) subjects[i] = {};
    if (!subjects[i].subject) subjects[i].subject = [];
    for (let j = 0; j < subjects[i].subject.length; j++) {
      result.schedule[i][j] = {};
      result.schedule[i][j].subject = subjects[i].subject[j];
      if (subjects[i].time.startTime || subjects[i].time.finishTime) {
        result.schedule[i][j].time = (subjects[i].time.startTime || "") + "～" + (subjects[i].time.finishTime || "");
      }

      if (i != 0) {
        if (!subjectPeriod[subjects[i].subject[j]]) subjectPeriod[subjects[i].subject[j]] = [];
        subjectPeriod[subjects[i].subject[j]].push(i);
      }
    }
    if (i == 0) {
      result.schedule[i].unshift({});
      result.schedule[i][0].subject = "その他";
    }
  }
  let lastScheduleType = "";
  for (let i = 1; i < subjects.length; i++) {
    if (!subjects[i].subject[0]) continue;
    if (!subjects[i].scheduleType || !subjects[i].scheduleType.scheduleType) {
      result.scheduleType += " +";
      lastScheduleType = "";
      continue;
    }
    let scheduleType = subjects[i].scheduleType.scheduleType;
    if (lastScheduleType != scheduleType) result.scheduleType += " " + scheduleType;
    else result.scheduleType += ",";
    lastScheduleType = scheduleType;
    let start; let end;
    for (; i < subjects.length; i++) {
      if (subjects[i].scheduleType.scheduleType != scheduleType) {
        i--;
        break;
      }
      let period = subjects[i].scheduleType.period;
      if (!start) {
        start = period;
      } else if (!end) {
        if (period == start + 1) {
          end = period;
        } else {
          i--;
          break;
        }
      } else {
        if (period == end + 1) {
          end = period;
        } else {
          i--;
          break;
        }
      }
    }
    if (!end) {
      result.scheduleType += start;
    } else {
      result.scheduleType += start + "-" + end;
    }
  }
  if (/^(\+| )+$/.test(result.scheduleType)) result.scheduleType = "他";

  const contents = getOneDayContents(date, userId);
  // i：時限、j：contentObjectsのインデックス、k：result.schedule[i]のインデックス
  for (let i = 0; i < contents.length; i++) {
    if (!contents[i]) contents[i] = {};
    /** @type {(dateContentData | timesContentData)[]} */
    const contentObjects = [].concat(contents[i].whole, contents[i].general, contents[i]["class"], contents[i].user);
    for (let j = 0; j < contentObjects.length; j++) {
      for (let k = 0; k < result.schedule[i].length; k++) {
        if (!contentObjects[j]) continue;
        if (result.schedule[i][k].subject == contentObjects[j].subject || (result.schedule[i][k].subject == "その他" && !contentObjects[j].subject)) {
          result.schedule[i][k].homework = (result.schedule[i][k].homework || []).concat(contentObjects[j].homework || []);
          result.schedule[i][k].homework = result.schedule[i][k].homework.filter(value => value);
          result.schedule[i][k].submit = (result.schedule[i][k].submit || []).concat(contentObjects[j].submit || []);
          result.schedule[i][k].submit = result.schedule[i][k].submit.filter(value => value);
          result.schedule[i][k].bring = (result.schedule[i][k].bring || []).concat(contentObjects[j].bring || []);
          result.schedule[i][k].bring = result.schedule[i][k].bring.filter(value => value);
          result.schedule[i][k].event = (result.schedule[i][k].event || []).concat(contentObjects[j].event || []);
          result.schedule[i][k].event = result.schedule[i][k].event.filter(value => value);
          result.schedule[i][k].note = (result.schedule[i][k].note || []).concat(contentObjects[j].note || []);
          result.schedule[i][k].note = result.schedule[i][k].note.filter(value => value);
          if (contentObjects[j].time && (contentObjects[j].time.startTime || contentObjects[j].time.finishTime)) {
            result.schedule[i][k].time = (contentObjects[j].time.startTime || "") + "～" + (contentObjects[j].time.finishTime || "");
          }
        }
      }
    }
  }
  return result;
}

/**
 * 特定の授業の指定された回数後の授業を返す関数
 * @param {string} subject - 授業の名称
 * @param {number} times - 何回後か（1以上）
 * @param {string} userId - ユーザーid
 * @param {boolean} is_fromUser - ユーザーの時間割を元にするかどうか
 * @return {{date:string, period:number} | null} 授業の情報（見つからなかった場合はnull）
 */
function getTimesClass(subject, times, userId, is_fromUser) {
  const className = data.user[userId].className;
  const date = new Date();
  date.setDate(date.getDate() - 1);
  let currentTimes = 0;
  for (let i = 0; i < 365; i++) {
    date.setDate(date.getDate() + 1);
    let currentSubjects;
    if (!is_fromUser) {
      currentSubjects = getClassSubjects(dateToString(date), className);
    } else {
      currentSubjects = getSubjects(dateToString(date), userId);
    }
    for (let period = 1; period < currentSubjects.length; period++) {
      if (currentSubjects[period] && currentSubjects[period].subject.includes(subject)) {
        currentTimes++;
        if (currentTimes == times) {
          return {date: dateToString(date), period: period};
        }
      }
    }
  }
  return null;
}

/**
 * 教科のリストを返す関数
 * @param {string} userId - ユーザーid
 * @return {string[]} 教科のリスト
 */
function getAllSubjects(userId) {
  let result = [];
  const className = data.user[userId].className;
  if (data.classes[className].table) {
    for (let scheduleType in data.classes[className].table) {
      for (let scheduleObject of data.classes[className].table[scheduleType].schedule) {
        if (!scheduleObject) continue;
        if (scheduleObject.subject) {
          for (let subject of scheduleObject.subject) {
            if (!subject) continue;
            if (!result.includes(subject)) result.push(subject);
          }
        }
      }
    }
  }
  result.sort((a, b) => {
    return a.localeCompare(b, 'ja');
  });
  return result;
}

/**
 * 日付を文字列にして返す関数
 * @param {Date} date - 日付
 * @return {string} 日付を示す文字列（yyyy-MM-dd）
 */
function dateToString(date) {
  return formatDate(date);
}


const scopeTypes = ["whole", "general", "class", "user"];