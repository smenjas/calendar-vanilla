class HTML {
    static getSelectOptions(options, selected) {
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
}

class Calendar {
    static now = new Date();
    static minYear = 1900;
    static maxYear = 2100;

    constructor() {
        this.language = 'en-us';

        const currentYear = Calendar.now.getFullYear();
        const currentMonth = Calendar.now.getMonth();

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
        this.thisMonth = new Date(queryYear, queryMonth);
        const thisYear = this.thisMonth.getFullYear();
        const thisMonthIndex = this.thisMonth.getMonth();

        // Which month came before the month shown?
        this.lastMonth = new Date(thisYear, thisMonthIndex - 1);

        // Which month came after the month shown?
        this.nextMonth = new Date(thisYear, thisMonthIndex + 1);

        this.daysInEachMonth = this.getDaysInEachMonth();
        this.monthNames = Calendar.getMonthNames(this.language);
        this.weekdayNames = Calendar.getWeekdayNames(this.language);
    }

    getDaysInEachMonth() {
        const daysInEachMonth = {};
        const thisYear = this.thisMonth.getFullYear();
        const thisMonthIndex = this.thisMonth.getMonth();
        const lastMonthsYear = this.lastMonth.getFullYear();
        const lastMonthIndex = this.lastMonth.getMonth();

        daysInEachMonth[thisYear] = {};

        for (let month = 0; month < 12; month++) {
            // Date zero is last month's max date.
            const monthEnd = new Date(thisYear, month + 1, 0);
            daysInEachMonth[thisYear][month] = monthEnd.getDate();
        }

        // Get last month's max date.
        const lastMonthsLastDate = new Date(thisYear, thisMonthIndex, 0);
        if (daysInEachMonth.hasOwnProperty(lastMonthsYear) === false) {
            daysInEachMonth[lastMonthsYear] = {};
        }
        daysInEachMonth[lastMonthsYear][lastMonthIndex] = lastMonthsLastDate.getDate();

        return daysInEachMonth;
    }

    static getMonthName(date, language, format = 'long') {
        // See https://devhints.io/wip/intl-datetime for format options.
        return Intl.DateTimeFormat(language, { month: format }).format(date);
    }

    static getMonthNames(language) {
        const monthNames = [];
        const currentYear = Calendar.now.getFullYear();

        for (let month = 0; month < 12; month++) {
            // Date zero is last month's max date.
            const monthEnd = new Date(currentYear, month + 1, 0);
            monthNames[month] = Calendar.getMonthName(monthEnd, language, 'long');
        }

        return monthNames;
    }

    static getWeekdayName(date, language, format = 'long') {
        // See https://devhints.io/wip/intl-datetime for format options.
        return Intl.DateTimeFormat(language, { weekday: format }).format(date);
    }

    static getWeekdayNames(language) {
        const currentDate = Calendar.now.getDate();
        const currentMonth = Calendar.now.getMonth();
        const currentYear = Calendar.now.getFullYear();
        const weekdayNames = [];

        for (let offset = 0; offset < 7; offset++) {
            const weekday = new Date(currentYear, currentMonth, currentDate + offset);
            weekdayNames[weekday.getDay()] = {
                long: Calendar.getWeekdayName(weekday, language, 'long'),
                short: Calendar.getWeekdayName(weekday, language, 'short'),
                //narrow: Calendar.getWeekdayName(weekday, language, 'narrow')
            }
        }

        return weekdayNames;
    }

    displayMonth() {
        const currentDate = Calendar.now.getDate();
        const currentMonth = Calendar.now.getMonth();
        const currentYear = Calendar.now.getFullYear();
        const lastMonthsYear = this.lastMonth.getFullYear();
        const lastMonthIndex = this.lastMonth.getMonth();
        const nextMonthIndex = this.nextMonth.getMonth();
        const nextMonthsYear = this.nextMonth.getFullYear();
        const thisMonthIndex = this.thisMonth.getMonth();
        const thisYear = this.thisMonth.getFullYear();

        // Which day of the week does this month start on?
        const monthStart = new Date(thisYear, thisMonthIndex, 1).getDay();

        // Which day of the week does this month end on?
        const monthEnd = new Date(thisYear, thisMonthIndex, this.daysInEachMonth[thisYear][thisMonthIndex]).getDay();

        const todayURL = `?month=${currentMonth}&amp;year=${currentYear}`;
        const lastMonthURL = `?month=${thisMonthIndex - 1}&amp;year=${thisYear}`;
        const nextMonthURL = `?month=${thisMonthIndex + 1}&amp;year=${thisYear}`;
        const lastYearURL = `?month=${thisMonthIndex}&amp;year=${thisYear - 1}`;
        const nextYearURL = `?month=${thisMonthIndex}&amp;year=${thisYear + 1}`;

        const years = {};
        for (let y = Calendar.minYear; y <= Calendar.maxYear; y++) {
            years[y] = y;
        }

        let content = '<div class="calendar">';
        content += '<nav>';

        content += '<form action="" method="get">';
        content += '<fieldset id="nav-calendar">';
        content += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;
        content += `<a href="${lastMonthURL}" class="last-month" title="Previous month">&larr;</a>`;

        content += '<select name="month" id="nav-month" onchange="this.form.submit()">';
        content += HTML.getSelectOptions(this.monthNames, thisMonthIndex);
        content += '</select>';

        content += '<select name="year" id="nav-year" onchange="this.form.submit()">';
        content += HTML.getSelectOptions(years, thisYear);
        content += '</select>';

        content += `<a href="${nextMonthURL}" class="next-month" title="Next month">&rarr;</a>`;
        content += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
        content += '</fieldset>';
        content += '</form>';

        const todayTitle = `${this.monthNames[currentMonth]} ${currentDate}, ${currentYear}`;
        content += `<a href="${todayURL}" class="today" title="${todayTitle}">Today</a>`;

        content += '</nav>';
        content += '<table><thead><tr>';

        for (const weekday in this.weekdayNames) {
            const longName = this.weekdayNames[weekday]['long'];
            const shortName = this.weekdayNames[weekday]['short'];
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
                    const lastMonthsDate = this.daysInEachMonth[lastMonthsYear][lastMonthIndex] - lastMonthOffset;
                    td = lastMonthsDate;
                    tdClass = 'last-month';
                    tdTitle = `${this.monthNames[lastMonthIndex]} ${lastMonthsDate}, ${lastMonthsYear}`
                }
                else if (monthHasEnded === false) {
                    // Show this month's dates.
                    dateShown += 1;
                    td = dateShown;
                    tdClass = 'this-month';
                    tdTitle = `${this.monthNames[thisMonthIndex]} ${dateShown}, ${thisYear}`

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
                    tdTitle = `${this.monthNames[nextMonthIndex]} ${nextMonthsDate}, ${nextMonthsYear}"`
                }

                // Has the current month ended yet?
                if (dateShown >= this.daysInEachMonth[thisYear][thisMonthIndex]) {
                    monthHasEnded = true;
                }

                tr += `<td class="${tdClass}" title="${tdTitle}">${td}</td>`;
            }

            content += `<tr>${tr}</tr>`;
        }

        content += '</tbody></table>';
        content += '</div>';

        document.body.insertAdjacentHTML('beforeend', content);
    }
}

const myCalendar = new Calendar();
myCalendar.displayMonth();
