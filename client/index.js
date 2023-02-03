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
    static language = 'en-us';
    static monthLengths = {};
    static monthNames = Calendar.getMonthNames(Calendar.language);
    static weekdayNames = Calendar.getWeekdayNames(Calendar.language);

    constructor() {
        const search = window.location.search;
        const params = new URLSearchParams(search);

        this.query = {};
        this.query['view'] = params.get('view');
        this.query['year'] = params.get('year');
        this.query['month'] = params.get('month');

        // Standardize the date inputs, just in case the month index is negative.
        const date = new Date(this.query['year'], this.query['month']);
        this.query['year'] = date.getFullYear();
        this.query['month'] = date.getMonth();

        if (!this.query['view']) {
            this.query['view'] = 'month';
        }
        if (!this.query['year']) {
            this.query['year'] = Calendar.now.getFullYear();
        }
        if (!this.query['month'] && (this.query['view'] === 'month' || !this.query['view'])) {
            this.query['month'] = Calendar.now.getMonth();
        }
    }

    render() {
        let html = '<div class="calendar">';

        switch (this.query['view']) {
            case 'year':
                html += Calendar.renderYearNav(this.query['year']);
                html += Calendar.renderYear(this.query['year']);
                break;
            default:
                html += Calendar.renderMonthNav(this.query['year'], this.query['month']);
                html += Calendar.renderMonth(this.query['year'], this.query['month']);
                break;
        }

        html += '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    static getMonthLength(year, month) {
        if (Calendar.monthLengths.hasOwnProperty(year) === false) {
            Calendar.monthLengths[year] = {};
        }

        if (Calendar.monthLengths[year][month] === undefined) {
            // Date zero is last month's max date.
            const monthEnd = new Date(year, month + 1, 0);
            Calendar.monthLengths[year][month] = monthEnd.getDate();
        }

        return Calendar.monthLengths[year][month];
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
        const currentYear = Calendar.now.getFullYear();
        const currentMonth = Calendar.now.getMonth();
        const currentDate = Calendar.now.getDate();
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

    static renderMonthNav(thisYear, thisMonthIndex) {
        const currentYear = Calendar.now.getFullYear();
        const currentMonth = Calendar.now.getMonth();
        const currentDate = Calendar.now.getDate();
        const todayTitle = `${Calendar.monthNames[currentMonth]} ${currentDate}, ${currentYear}`;
        const todayURL = '?view=month';
        const lastMonthURL = `?view=month&amp;year=${thisYear}&amp;month=${thisMonthIndex - 1}`;
        const nextMonthURL = `?view=month&amp;year=${thisYear}&amp;month=${thisMonthIndex + 1}`;
        const lastYearURL = `?view=month&amp;year=${thisYear - 1}&amp;month=${thisMonthIndex}`;
        const nextYearURL = `?view=month&amp;year=${thisYear + 1}&amp;month=${thisMonthIndex}`;
        const thisYearURL = `?view=year&amp;year=${thisYear}`;

        const years = {};
        for (let y = Calendar.minYear; y <= Calendar.maxYear; y++) {
            years[y] = y;
        }

        let html = '<nav>';
        html += `<a href="${todayURL}" class="today" title="${todayTitle}">Today</a>`;
        html += `<a href="${thisYearURL}" class="this-year">${thisYear}</a>`;

        html += '<form action="" method="get">';
        html += '<fieldset id="nav-calendar">';
        html += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;
        html += `<a href="${lastMonthURL}" class="last-month" title="Previous month">&larr;</a>`;

        html += '<select name="month" id="nav-month" onchange="this.form.submit()">';
        html += HTML.getSelectOptions(Calendar.monthNames, thisMonthIndex);
        html += '</select>';

        html += '<select name="year" id="nav-year" onchange="this.form.submit()">';
        html += HTML.getSelectOptions(years, thisYear);
        html += '</select>';

        html += `<a href="${nextMonthURL}" class="next-month" title="Next month">&rarr;</a>`;
        html += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
        html += '</fieldset>';
        html += '</form>';
        html += '</nav>';

        return html;
    }

    static renderYearNav(year) {
        const currentYear = Calendar.now.getFullYear();

        const currentYearURL = `?view=year&amp;year=${currentYear}`;
        const lastYearURL = `?view=year&amp;year=${year - 1}`;
        const nextYearURL = `?view=year&amp;year=${year + 1}`;

        const years = {};
        for (let y = Calendar.minYear; y <= Calendar.maxYear; y++) {
            years[y] = y;
        }

        let html = '<nav>';
        html += `<a href="${currentYearURL}" class="this-year">${currentYear}</a>`;

        html += '<form action="" method="get">';
        html += '<input type="hidden" name="view" value="year">';
        html += '<fieldset id="nav-calendar">';
        html += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;

        html += '<select name="year" id="nav-year" onchange="this.form.submit()">';
        html += HTML.getSelectOptions(years, year);
        html += '</select>';

        html += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
        html += '</fieldset>';
        html += '</form>';
        html += '</nav>';

        return html;
    }

    static renderMonth(thisYear, thisMonthIndex) {
        const thisMonthsLength = Calendar.getMonthLength(thisYear, thisMonthIndex);

        const lastMonth = new Date(thisYear, thisMonthIndex - 1);
        const lastMonthsYear = lastMonth.getFullYear();
        const lastMonthIndex = lastMonth.getMonth();
        const lastMonthsLength = Calendar.getMonthLength(lastMonthsYear, lastMonthIndex);

        const nextMonth = new Date(thisYear, thisMonthIndex + 1);
        const nextMonthsYear = nextMonth.getFullYear();
        const nextMonthIndex = nextMonth.getMonth();

        const currentYear = Calendar.now.getFullYear();
        const currentMonth = Calendar.now.getMonth();
        const currentDate = Calendar.now.getDate();

        // Which day of the week does this month start on?
        const monthStartDay = new Date(thisYear, thisMonthIndex, 1).getDay();

        let html = `<table class="month" id="month-${thisMonthIndex}"><thead><tr>`;

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
                if (monthHasBegun === false && monthStartDay === weekday) {
                    monthHasBegun = true;
                }

                // Which month are we in?
                if (monthHasBegun === false) {
                    // Show last month's dates.
                    const lastMonthOffset = monthStartDay - (weekday + 1);
                    const lastMonthsDate = lastMonthsLength - lastMonthOffset;
                    td = lastMonthsDate;
                    tdClass = 'last-month';
                    tdTitle = `${Calendar.monthNames[lastMonthIndex]} ${lastMonthsDate}, ${lastMonthsYear}`
                }
                else if (monthHasEnded === false) {
                    // Show this month's dates.
                    dateShown += 1;
                    td = dateShown;
                    tdClass = 'this-month';
                    tdTitle = `${Calendar.monthNames[thisMonthIndex]} ${dateShown}, ${thisYear}`

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
                    tdTitle = `${Calendar.monthNames[nextMonthIndex]} ${nextMonthsDate}, ${nextMonthsYear}"`
                }

                // Has the current month ended yet?
                if (dateShown >= thisMonthsLength) {
                    monthHasEnded = true;
                }

                tr += `<td class="${tdClass}" title="${tdTitle}">${td}</td>`;
            }

            html += `<tr>${tr}</tr>`;
        }

        html += '</tbody></table>';

        return html;
    }

    static renderYear(year) {
        let html = '<div class="year">';

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const thisMonth = new Date(year, monthIndex);
            const monthURL = `?view=month&amp;year=${year}&amp;month=${monthIndex}`;
            html += `<div class="month" id="month-${monthIndex}">`;
            html += `<h3><a href="${monthURL}">${Calendar.monthNames[monthIndex]}</a></h3>`;
            html += Calendar.renderMonth(year, thisMonth.getMonth());
            html += '</div>';
        }

        html += '</div>';

        return html;
    }
}

const myCalendar = new Calendar();
myCalendar.render();
