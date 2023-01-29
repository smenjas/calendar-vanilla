function getMonthName(date, language, format = 'long') {
    // See https://devhints.io/wip/intl-datetime for format options.
    return Intl.DateTimeFormat(language, { month: format }).format(date);
}

function getWeekdayName(date, language, format = 'long') {
    // See https://devhints.io/wip/intl-datetime for format options.
    return Intl.DateTimeFormat(language, { weekday: format }).format(date);
}

const minYear = 1970;
const maxYear = 2100;

const query = window.location.search;
const params = new URLSearchParams(query);
queryYear = params.get('year');
queryMonth = params.get('month');

const now = new Date(queryYear, queryMonth);
const thisYear = now.getFullYear();
const thisMonth = now.getMonth(); // Month index, 0 is January
const thisDate = now.getDate();

const past = new Date(thisYear, thisMonth - 1);
const lastMonthsYear = past.getFullYear();
const lastMonth = past.getMonth();

const future = new Date(thisYear, thisMonth + 1);
const nextMonthsYear = future.getFullYear();
const nextMonth = future.getMonth();

const language = 'en-us';
const monthNames = [];
const daysInMonth = {};
daysInMonth[thisYear] = {};

for (let month = 0; month < 12; month++) {
    // Date zero is last month's max date.
    const monthEnd = new Date(thisYear, month + 1, 0);

    monthNames[month] = getMonthName(monthEnd, language);
    daysInMonth[thisYear][month] = monthEnd.getDate();
}

const weekdayNames = [];
for (let offset = 0; offset < 7; offset++) {
    const weekday = new Date(thisYear, thisMonth, thisDate + offset);
    weekdayNames[weekday.getDay()] = {
        long: getWeekdayName(weekday, language, 'long'),
        short: getWeekdayName(weekday, language, 'short'),
        //narrow: getWeekdayName(weekday, language, 'narrow')
    }
}

// Which day of the week does this month start on?
const monthStart = new Date(thisYear, thisMonth, 1).getDay();

if (monthStart !== 0) {
    // Get last month's max date.
    const lastMonthsLastDate = new Date(thisYear, thisMonth, 0);
    if (daysInMonth.hasOwnProperty(lastMonthsYear) === false) {
        daysInMonth[lastMonthsYear] = {};
    }
    daysInMonth[lastMonthsYear][lastMonth] = lastMonthsLastDate.getDate();
}

// Which day of the week does this month end on?
const monthEnd = new Date(thisYear, thisMonth, daysInMonth[thisYear][thisMonth]).getDay();

let lastMonthURL = `?month=${thisMonth - 1}&amp;year=${thisYear}`;
let nextMonthURL = `?month=${thisMonth + 1}&amp;year=${thisYear}`;
let lastYearURL = `?month=${thisMonth}&amp;year=${thisYear - 1}`;
let nextYearURL = `?month=${thisMonth}&amp;year=${thisYear + 1}`;

let content = '<div class="calendar">';
content += '<nav>';

content += '<form action="" method="get">';
content += '<fieldset id="nav-calendar">';
content += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;
content += `<a href="${lastMonthURL}" class="last-month" title="Previous month">&larr;</a>`;

content += '<select name="month" id="nav-month" onchange="this.form.submit()">';

for (const m in monthNames) {
    const month = monthNames[m];
    let selected = '';
    if (parseInt(m) === thisMonth) {
        selected = ' selected';
    }
    content += `<option value="${m}"${selected}>${month}</option>`;
}

content += '</select>';

content += '<select name="year" id="nav-year" onchange="this.form.submit()">';

for (let y = minYear; y < maxYear; y++) {
    let selected = '';
    if (y === thisYear) {
        selected = ' selected';
    }
    content += `<option value="${y}"${selected}>${y}</option>`;
}

content += '</select>';

content += `<a href="${nextMonthURL}" class="next-month" title="Next month">&rarr;</a>`;
content += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
content += '</fieldset>';
content += '</form>';

content += '</nav>';
content += '<table><thead><tr>';

for (const weekday in weekdayNames) {
    let longName = weekdayNames[weekday]['long'];
    let shortName = weekdayNames[weekday]['short'];
    content += `<th><abbr title="${longName}">${shortName}</abbr></th>`;
}

content += '</tr></thead><tbody>';

let dateShown = 0;
let nextMonthsDate = 0;
let monthHasBegun = false;
let monthHasEnded = false;
const today = new Date();

while (monthHasEnded === false) {
    let tr = '';

    for (let weekday = 0; weekday < 7; weekday++) {
        let td = '';
        let tdClass = '';
        let tdTitle = '';

        // Has the current month started yet?
        if (monthHasBegun === false && monthStart === weekday) {
            monthHasBegun = true;
        }

        // Which month are we in?
        if (monthHasBegun === false) {
            // Show last month's dates.
            let lastMonthOffset = monthStart - (weekday + 1);
            let lastMonthsDate = daysInMonth[lastMonthsYear][lastMonth] - lastMonthOffset;
            td = lastMonthsDate;
            tdClass = 'last-month';
            tdTitle = `${monthNames[lastMonth]} ${lastMonthsDate}, ${lastMonthsYear}`
        }
        else if (monthHasEnded === false) {
            // Show this month's dates.
            dateShown += 1;
            td = dateShown;
            tdClass = 'this-month';
            tdTitle = `${monthNames[thisMonth]} ${dateShown}, ${thisYear}`

            if (dateShown === today.getDate() &&
                thisMonth === today.getMonth() &&
                thisYear === today.getFullYear()) {
                tdClass += ' today';
                tdTitle += ' (Today)';
            }
        }
        else {
            // Show next month's dates.
            nextMonthsDate += 1;
            td = nextMonthsDate;
            tdClass = 'next-month';
            tdTitle = `${monthNames[nextMonth]} ${nextMonthsDate}, ${nextMonthsYear}"`
        }

        // Has the current month ended yet?
        if (dateShown >= daysInMonth[thisYear][thisMonth]) {
            monthHasEnded = true;
        }

        tr += `<td class="${tdClass}" title="${tdTitle}">${td}</td>`;
    }

    content += `<tr>${tr}</tr>`;
}

content += '</tbody></table>';
content += '</div>';

document.body.insertAdjacentHTML('beforeend', content);
