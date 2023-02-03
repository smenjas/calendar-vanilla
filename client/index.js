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

        this.monthNames = Calendar.getMonthNames(this.language);
        this.weekdayNames = Calendar.getWeekdayNames(this.language);
    }

    static getDaysInMonth(year, month) {
        // Date zero is last month's max date.
        const monthEnd = new Date(year, month + 1, 0);
        return monthEnd.getDate();
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

    renderMonth() {
        const currentDate = Calendar.now.getDate();
        const currentMonth = Calendar.now.getMonth();
        const currentYear = Calendar.now.getFullYear();

        const thisMonthIndex = this.thisMonth.getMonth();
        const thisYear = this.thisMonth.getFullYear();
        const thisMonthsMaxDate = Calendar.getDaysInMonth(thisYear, thisMonthIndex);

        const lastMonth = new Date(thisYear, thisMonthIndex - 1);
        const lastMonthIndex = lastMonth.getMonth();
        const lastMonthsYear = lastMonth.getFullYear();
        const lastMonthsMaxDate = Calendar.getDaysInMonth(lastMonthsYear, lastMonthIndex);

        const nextMonth = new Date(thisYear, thisMonthIndex + 1);
        const nextMonthIndex = nextMonth.getMonth();
        const nextMonthsYear = nextMonth.getFullYear();

        // Which day of the week does this month start on?
        const monthStart = new Date(thisYear, thisMonthIndex, 1).getDay();

        const todayTitle = `${this.monthNames[currentMonth]} ${currentDate}, ${currentYear}`;
        const todayURL = `?month=${currentMonth}&amp;year=${currentYear}`;
        const lastMonthURL = `?month=${thisMonthIndex - 1}&amp;year=${thisYear}`;
        const nextMonthURL = `?month=${thisMonthIndex + 1}&amp;year=${thisYear}`;
        const lastYearURL = `?month=${thisMonthIndex}&amp;year=${thisYear - 1}`;
        const nextYearURL = `?month=${thisMonthIndex}&amp;year=${thisYear + 1}`;

        const years = {};
        for (let y = Calendar.minYear; y <= Calendar.maxYear; y++) {
            years[y] = y;
        }

        let html = '<div class="calendar">';
        html += '<nav>';
        html += `<a href="${todayURL}" class="today" title="${todayTitle}">Today</a>`;

        html += '<form action="" method="get">';
        html += '<fieldset id="nav-calendar">';
        html += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;
        html += `<a href="${lastMonthURL}" class="last-month" title="Previous month">&larr;</a>`;

        html += '<select name="month" id="nav-month" onchange="this.form.submit()">';
        html += HTML.getSelectOptions(this.monthNames, thisMonthIndex);
        html += '</select>';

        html += '<select name="year" id="nav-year" onchange="this.form.submit()">';
        html += HTML.getSelectOptions(years, thisYear);
        html += '</select>';

        html += `<a href="${nextMonthURL}" class="next-month" title="Next month">&rarr;</a>`;
        html += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
        html += '</fieldset>';
        html += '</form>';

        html += '</nav>';
        html += '<table><thead><tr>';

        for (const weekday in this.weekdayNames) {
            const longName = this.weekdayNames[weekday]['long'];
            const shortName = this.weekdayNames[weekday]['short'];
            html += `<th><abbr title="${longName}">${shortName}</abbr></th>`;
        }

        html += '</tr></thead><tbody>';

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
                    const lastMonthsDate = lastMonthsMaxDate - lastMonthOffset;
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
                if (dateShown >= thisMonthsMaxDate) {
                    monthHasEnded = true;
                }

                tr += `<td class="${tdClass}" title="${tdTitle}">${td}</td>`;
            }

            html += `<tr>${tr}</tr>`;
        }

        html += '</tbody></table>';
        html += '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }
}

const myCalendar = new Calendar();
myCalendar.renderMonth();
