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
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const currentDate = now.getDate();

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
const thisMonth = new Date(queryYear, queryMonth);
const thisYear = thisMonth.getFullYear();
const thisMonthIndex = thisMonth.getMonth(); // Month index, 0 is January
const thisDate = thisMonth.getDate();

// Which month came before the month shown?
const lastMonth = new Date(thisYear, thisMonthIndex - 1);
const lastMonthsYear = lastMonth.getFullYear();
const lastMonthIndex = lastMonth.getMonth();

// Which month came after the month shown?
const nextMonth = new Date(thisYear, thisMonthIndex + 1);
const nextMonthsYear = nextMonth.getFullYear();
const nextMonthIndex = nextMonth.getMonth();

const language = 'en-us';
const monthNames = [];
const daysInEachMonth = {};
daysInEachMonth[thisYear] = {};

for (let month = 0; month < 12; month++) {
    // Date zero is last month's max date.
    const monthEnd = new Date(thisYear, month + 1, 0);

    monthNames[month] = getMonthName(monthEnd, language);
    daysInEachMonth[thisYear][month] = monthEnd.getDate();
}

const weekdayNames = [];
for (let offset = 0; offset < 7; offset++) {
    const weekday = new Date(thisYear, thisMonthIndex, thisDate + offset);
    weekdayNames[weekday.getDay()] = {
        long: getWeekdayName(weekday, language, 'long'),
        short: getWeekdayName(weekday, language, 'short'),
        //narrow: getWeekdayName(weekday, language, 'narrow')
    }
}

// Which day of the week does this month start on?
const monthStart = new Date(thisYear, thisMonthIndex, 1).getDay();

if (monthStart !== 0) {
    // Get last month's max date.
    const lastMonthsLastDate = new Date(thisYear, thisMonthIndex, 0);
    if (daysInEachMonth.hasOwnProperty(lastMonthsYear) === false) {
        daysInEachMonth[lastMonthsYear] = {};
    }
    daysInEachMonth[lastMonthsYear][lastMonthIndex] = lastMonthsLastDate.getDate();
}

// Which day of the week does this month end on?
const monthEnd = new Date(thisYear, thisMonthIndex, daysInEachMonth[thisYear][thisMonthIndex]).getDay();

const todayURL = `?month=${currentMonth}&amp;year=${currentYear}`;
const lastMonthURL = `?month=${thisMonthIndex - 1}&amp;year=${thisYear}`;
const nextMonthURL = `?month=${thisMonthIndex + 1}&amp;year=${thisYear}`;
const lastYearURL = `?month=${thisMonthIndex}&amp;year=${thisYear - 1}`;
const nextYearURL = `?month=${thisMonthIndex}&amp;year=${thisYear + 1}`;

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
content += getSelectOptions(monthNames, thisMonthIndex);
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
            const lastMonthsDate = daysInEachMonth[lastMonthsYear][lastMonthIndex] - lastMonthOffset;
            td = lastMonthsDate;
            tdClass = 'last-month';
            tdTitle = `${monthNames[lastMonthIndex]} ${lastMonthsDate}, ${lastMonthsYear}`
        }
        else if (monthHasEnded === false) {
            // Show this month's dates.
            dateShown += 1;
            td = dateShown;
            tdClass = 'this-month';
            tdTitle = `${monthNames[thisMonthIndex]} ${dateShown}, ${thisYear}`

            if (dateShown === currentDate &&
                thisMonthIndex === currentMonth &&
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
            tdTitle = `${monthNames[nextMonthIndex]} ${nextMonthsDate}, ${nextMonthsYear}"`
        }

        // Has the current month ended yet?
        if (dateShown >= daysInEachMonth[thisYear][thisMonthIndex]) {
            monthHasEnded = true;
        }

        tr += `<td class="${tdClass}" title="${tdTitle}">${td}</td>`;
    }

    content += `<tr>${tr}</tr>`;
}

content += '</tbody></table>';
content += '</div>';

document.body.insertAdjacentHTML('beforeend', content);
