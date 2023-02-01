function getMonthName(date, language, format = 'long') {
    // See https://devhints.io/wip/intl-datetime for format options.
    return Intl.DateTimeFormat(language, { month: format }).format(date);
}

function getWeekdayName(date, language, format = 'long') {
    // See https://devhints.io/wip/intl-datetime for format options.
    return Intl.DateTimeFormat(language, { weekday: format }).format(date);
}

function getSelectOptions(options, selected) {
    let html = '';
    for (const option in options) {
        const optionText = options[option];
        let selectedAttr = '';
        if (selected.toString() === option.toString()) {
            selectedAttr = ' selected';
        }
        html += `<option value="${option}"${selectedAttr}>${optionText}</option>`;
    }
    return html;
}

const minYear = 1900;
const maxYear = 2100;

// When is today?
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();
const currentDate = today.getDate();

const query = window.location.search;
const params = new URLSearchParams(query);
let queryYear = params.get('year');
let queryMonth = params.get('month');
if (!queryYear) {
    queryYear = currentYear;
}
if (!queryMonth) {
    queryMonth = currentMonth;
}

// Which month are we showing?
const present = new Date(queryYear, queryMonth);
const thisYear = present.getFullYear();
const thisMonth = present.getMonth(); // Month index, 0 is January
const thisDate = present.getDate();

// Which month came before the month shown?
const past = new Date(thisYear, thisMonth - 1);
const lastMonthsYear = past.getFullYear();
const lastMonth = past.getMonth();

// Which month came after the month shown?
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

const todayURL = `?month=${currentMonth}&amp;year=${currentYear}`;
const lastMonthURL = `?month=${thisMonth - 1}&amp;year=${thisYear}`;
const nextMonthURL = `?month=${thisMonth + 1}&amp;year=${thisYear}`;
const lastYearURL = `?month=${thisMonth}&amp;year=${thisYear - 1}`;
const nextYearURL = `?month=${thisMonth}&amp;year=${thisYear + 1}`;

const years = {};
for (let y = minYear; y <= maxYear; y++) {
    years[y] = y;
}

let content = '<div class="calendar">';
content += '<nav>';

content += '<form action="" method="get">';
content += '<fieldset id="nav-calendar">';
content += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;
content += `<a href="${lastMonthURL}" class="last-month" title="Previous month">&larr;</a>`;

content += '<select name="month" id="nav-month" onchange="this.form.submit()">';
content += getSelectOptions(monthNames, thisMonth);
content += '</select>';

content += '<select name="year" id="nav-year" onchange="this.form.submit()">';
content += getSelectOptions(years, thisYear);
content += '</select>';

content += `<a href="${nextMonthURL}" class="next-month" title="Next month">&rarr;</a>`;
content += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
content += '</fieldset>';
content += '</form>';

const todayTitle = `${monthNames[currentMonth]} ${currentDate}, ${currentYear}`;
content += `<a href="${todayURL}" class="today" title="${todayTitle}">Today</a>`;

content += '</nav>';
content += '<table><thead><tr>';

for (const weekday in weekdayNames) {
    const longName = weekdayNames[weekday]['long'];
    const shortName = weekdayNames[weekday]['short'];
    content += `<th><abbr title="${longName}">${shortName}</abbr></th>`;
}

content += '</tr></thead><tbody>';

let dateShown = 0;
let nextMonthsDate = 0;
let monthHasBegun = false;
let monthHasEnded = false;

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
            const lastMonthOffset = monthStart - (weekday + 1);
            const lastMonthsDate = daysInMonth[lastMonthsYear][lastMonth] - lastMonthOffset;
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

            if (dateShown === currentDate &&
                thisMonth === currentMonth &&
                thisYear === currentYear) {
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
