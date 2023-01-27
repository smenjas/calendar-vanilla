const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth(); // Month index, 0 is January
const thisDate = now.getDate();

const language = 'en-us';
const daysInMonth = [];
const monthNames = [];
for (let month = 0; month < 12; month++) {
    const monthEnd = new Date(thisYear, month + 1, 0); // Zero is last month's max date.
    daysInMonth[month] = monthEnd.getDate();
    monthNames[month] = Intl.DateTimeFormat(language, { month: 'long' }).format(monthEnd);
}

const weekdayNames = [];
for (let offset = 0; offset < 7; offset++) {
    let weekday = new Date(thisYear, thisMonth, thisDate + offset);
    weekdayNames[weekday.getDay()] = {
        // See https://devhints.io/wip/intl-datetime for options.
        long: Intl.DateTimeFormat(language, { weekday: 'long' }).format(weekday),
        short: Intl.DateTimeFormat(language, { weekday: 'short' }).format(weekday),
        //narrow: Intl.DateTimeFormat(language, { weekday: 'narrow' }).format(weekday)
    }
}

// Which day of the week does this month start on?
const monthStart = new Date(thisYear, thisMonth, 1).getDay();

let content = '<div class="calendar">\n';
content += `<h2>${monthNames[thisMonth]} ${thisYear}</h2>\n`;
content += '<table><thead><tr>\n';

for (const weekday in weekdayNames) {
    let longName = weekdayNames[weekday]['long'];
    let shortName = weekdayNames[weekday]['short'];
    content += `\t<th><abbr title="${longName}">${shortName}</abbr></th>\n`;
}
content += '</tr></thead><tbody>';

let dateShown = 0;
let monthHasBegun = false;
let monthHasEnded = false;
while (monthHasEnded === false) {
    content += '<tr>\n';
    for (let weekday = 0; weekday < 7; weekday++) {
        content += '\t<td>';
        if (monthHasBegun === false && monthStart === weekday) {
            monthHasBegun = true;
        }
        if (monthHasBegun === true && monthHasEnded === false) {
            dateShown += 1;
            content += `<span class="date">${dateShown}</span>`;
        }
        content += '</td>\n';
        if (dateShown >= daysInMonth[thisMonth]) {
            monthHasEnded = true;
        }
    }
    content += '</tr>';
}
content += '</tbody></table>\n';
content += '</div>\n';

document.body.insertAdjacentHTML('beforeend', content);
