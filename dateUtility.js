/**
 * Dateオブジェクトを日付と時刻を表す文字列に変換する関数
 * @param {Date} date 変換する日付
 * @param {boolean} isDate 時刻を00:00:00にするかどうか
 * @returns 0000-00-00T00:00:00の形で表された日付
 */
function formatDateTime(date, isDate = false) {
    const _year = date.getUTCFullYear();
    const _month = date.getUTCMonth() + 1;
    const _date = date.getUTCDate();
    const _hours = date.getUTCHours();
    const _minites = date.getUTCMinutes();
    const _seconds = date.getUTCSeconds();
    let yearString = _year.toString();
    let monthString = _month.toString();
    let dateString = _date.toString();
    let hoursString = _hours.toString();
    let minitesString = _minites.toString();
    let secondsString = _seconds.toString();
    if (monthString.length < 2) {
        monthString = "0".repeat(2 - monthString.length) + monthString;
    }
    if (dateString.length < 2) {
        dateString = "0".repeat(2 - dateString.length) + dateString;
    }
    if (hoursString.length < 2) {
        hoursString = "0".repeat(2 - hoursString.length) + hoursString;
    }
    if (minitesString.length < 2) {
        minitesString = "0".repeat(2 - minitesString.length) + minitesString;
    }
    if (secondsString.length < 2) {
        secondsString = "0".repeat(2 - secondsString.length) + secondsString;
    }
    if (isDate) {
        hoursString = "00";
        minitesString = "00";
        secondsString = "00";
    }
    return yearString + "-" + monthString + "-" + dateString + "T" + hoursString + ":" + minitesString + ":" + secondsString;
}
  
/**
 * Dateオブジェクトを日付を表す文字列に変換する関数
 * @param {Date} date 変換する日付
 * @returns 0000-00-00の形で表された日付
 */
function formatDate(date) {
    const _year = date.getUTCFullYear();
    const _month = date.getUTCMonth() + 1;
    const _date = date.getUTCDate();
    let yearString = _year.toString();
    let monthString = _month.toString();
    let dateString = _date.toString();
    if (monthString.length < 2) {
        monthString = "0".repeat(2 - monthString.length) + monthString;
    }
    if (dateString.length < 2) {
        dateString = "0".repeat(2 - dateString.length) + dateString;
    }
    return yearString + "-" + monthString + "-" + dateString;
}