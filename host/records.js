// The records table's dates, which need moment's locale (the page called
// moment.locale(lang) at load): the app writes each date cell as
// <td data-date="13:58 02092026"></td>, the string the original handed
// moment, and this formats it the way the original's
// moment(input, "HH:mm DDMMYYYY").format("HH:mm, MMM D YYYY") did,
// "Invalid date" included. The app decides everything else (which rows,
// their order, values and colours).
//
// runtime.js: import { fillDates } from "./records.js"; and in exec():
//   case "CDates": if (e) fillDates(e, c.parse, c.format); break;
// for the command CDates{id, parse, format}.

export function fillDates(root, parse, format) {
  for (const cell of root.querySelectorAll("[data-date]")) {
    cell.innerHTML = moment(cell.getAttribute("data-date"), parse).format(format);
  }
}
