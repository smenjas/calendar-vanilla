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
    static language = 'en-us';
    static monthLengths = {};
    static monthNames = Calendar.getMonthNames(Calendar.language);
    static weekdayNames = Calendar.getWeekdayNames(Calendar.language);

    constructor() {
        const params = new URLSearchParams(window.location.search);

        this.query = {};
        this.query['view'] = params.get('view');
        this.query['year'] = params.get('year');
        this.query['month'] = params.get('month');

        if (!this.query['view']) {
            this.query['view'] = 'month';
        }
        if (this.query['view'] === 'month' && !this.query['month']) {
            this.query['month'] = Calendar.now.getMonth();
        }
        if (!this.query['year']) {
            this.query['year'] = Calendar.now.getFullYear();
        }

        // Standardize the date inputs, just in case the month index is negative.
        const date = new Date(this.query['year'], this.query['month']);
        this.query['year'] = date.getFullYear();
        this.query['month'] = date.getMonth();
    }

    render() {
        let html = '<div class="calendar">';

        switch (this.query['view']) {
            case 'year':
                html += Calendar.renderYearNav(this.query['year'], this.query['month']);
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
            // Day zero is last month's max date.
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
        const nowYear = Calendar.now.getFullYear();

        for (let month = 0; month < 12; month++) {
            const date = new Date(nowYear, month, 1);
            monthNames[month] = Calendar.getMonthName(date, language, 'long');
        }

        return monthNames;
    }

    static getWeekdayName(date, language, format = 'long') {
        // See https://devhints.io/wip/intl-datetime for format options.
        return Intl.DateTimeFormat(language, { weekday: format }).format(date);
    }

    static getWeekdayNames(language) {
        const nowYear = Calendar.now.getFullYear();
        const nowMonth = Calendar.now.getMonth();
        const nowDay = Calendar.now.getDate();
        const weekdayNames = [];

        for (let offset = 0; offset < 7; offset++) {
            const weekday = new Date(nowYear, nowMonth, nowDay + offset);
            weekdayNames[weekday.getDay()] = {
                long: Calendar.getWeekdayName(weekday, language, 'long'),
                short: Calendar.getWeekdayName(weekday, language, 'short'),
                narrow: Calendar.getWeekdayName(weekday, language, 'narrow')
            }
        }

        return weekdayNames;
    }

    static getMonthOptions(month) {
        return HTML.getSelectOptions(Calendar.monthNames, month);
    }

    static getYearOptions(year) {
        const minYear = 1900;
        const maxYear = 2100;
        const years = {};

        for (let y = minYear; y <= maxYear; y++) {
            years[y] = y;
        }

        return HTML.getSelectOptions(years, year);
    }

    static renderCommonNav(year, month, view) {
        const dateQuery = `year=${year}&amp;month=${month}`;
        const yearURL = `?view=year&amp;${dateQuery}`;
        const monthURL = `?view=month&amp;${dateQuery}`;

        const nowYear = Calendar.now.getFullYear();
        const nowMonth = Calendar.now.getMonth();
        const nowDay = Calendar.now.getDate();
        const nowTitle = `${Calendar.monthNames[nowMonth]} ${nowDay}, ${nowYear}`;
        const nowURL = `?view=${view}&amp;year=${nowYear}&amp;month=${nowMonth}&amp;day=${nowDay}`;

        let html = `<a href="${yearURL}" class="this-year">Year</a>`;
        html += `<a href="${monthURL}" class="this-month">Month</a>`;
        html += `<a href="${nowURL}" class="now" title="${nowTitle}">Now</a>`;

        return html;
    }

    static renderMonthNav(year, month) {
        const lastMonthURL = `?view=month&amp;year=${year}&amp;month=${month - 1}`;
        const nextMonthURL = `?view=month&amp;year=${year}&amp;month=${month + 1}`;
        const lastYearURL = `?view=month&amp;year=${year - 1}&amp;month=${month}`;
        const nextYearURL = `?view=month&amp;year=${year + 1}&amp;month=${month}`;

        let html = '<nav>';
        html += Calendar.renderCommonNav(year, month, 'month');

        html += '<form action="" method="get">';
        html += '<fieldset id="nav-calendar">';
        html += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;
        html += `<a href="${lastMonthURL}" class="last-month" title="Previous month">&larr;</a>`;

        html += '<select name="month" id="nav-month" onchange="this.form.submit()">';
        html += Calendar.getMonthOptions(month);
        html += '</select>';

        html += '<select name="year" id="nav-year" onchange="this.form.submit()">';
        html += Calendar.getYearOptions(year);
        html += '</select>';

        html += `<a href="${nextMonthURL}" class="next-month" title="Next month">&rarr;</a>`;
        html += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
        html += '</fieldset>';
        html += '</form>';
        html += '</nav>';

        return html;
    }

    static renderYearNav(year, month) {
        const lastYearURL = `?view=year&amp;year=${year - 1}`;
        const nextYearURL = `?view=year&amp;year=${year + 1}`;

        let html = '<nav>';
        html += Calendar.renderCommonNav(year, month, 'year');

        html += '<form action="" method="get">';
        html += '<input type="hidden" name="view" value="year">';
        html += '<fieldset id="nav-calendar">';
        html += `<a href="${lastYearURL}" class="last-year" title="Previous year">&lArr;</a>`;

        html += '<select name="year" id="nav-year" onchange="this.form.submit()">';
        html += Calendar.getYearOptions(year);
        html += '</select>';

        html += `<a href="${nextYearURL}" class="next-year" title="Next year">&rArr;</a>`;
        html += '</fieldset>';
        html += '</form>';
        html += '</nav>';

        return html;
    }

    static renderMonth(year, month, small = false) {
        const monthLength = Calendar.getMonthLength(year, month);

        const before = new Date(year, month - 1);
        const lastMonthsYear = before.getFullYear();
        const lastMonth = before.getMonth();
        const lastMonthsLength = Calendar.getMonthLength(lastMonthsYear, lastMonth);

        const after = new Date(year, month + 1);
        const nextMonthsYear = after.getFullYear();
        const nextMonth = after.getMonth();

        const nowYear = Calendar.now.getFullYear();
        const nowMonth = Calendar.now.getMonth();
        const nowDay = Calendar.now.getDate();

        // Which day of the week does this month start on?
        const monthStartsOn = new Date(year, month, 1).getDay();

        const weeksInMonth = Math.ceil((monthLength + monthStartsOn) / 7);

        const shortNameFormat = (small === true) ?  'narrow' : 'short';

        let html = `<table class="month" id="month-${month}"><thead><tr>`;

        for (const weekday in Calendar.weekdayNames) {
            const longName = Calendar.weekdayNames[weekday]['long'];
            const shortName = Calendar.weekdayNames[weekday][shortNameFormat];
            html += `<th class="weekday-${weekday}"><abbr title="${longName}">${shortName}</abbr></th>`;
        }

        html += '</tr></thead><tbody>';

        let day = 0;
        let nextMonthsDay = 0;
        let monthHasBegun = false;
        let monthHasEnded = false;
        let rowCount = 1;
        let trClass = '';

        while (monthHasEnded === false) {
            let tr = '';

            for (let weekday = 0; weekday < 7; weekday++) {
                let showYear = '';
                let showMonth = '';
                let showDay = '';
                let tdClass = `weekday-${weekday}`

                // Has the month being shown started yet?
                if (monthHasBegun === false && monthStartsOn === weekday) {
                    monthHasBegun = true;
                }

                // Which month are we in?
                if (monthHasBegun === false) {
                    // Show last month's dates.
                    const offset = monthStartsOn - (weekday + 1);
                    const lastMonthsDay = lastMonthsLength - offset;
                    showYear = lastMonthsYear;
                    showMonth = lastMonth;
                    showDay = lastMonthsDay;
                    tdClass += ' last-month';
                }
                else if (monthHasEnded === false) {
                    // Show this month's dates.
                    day += 1;
                    showYear = year;
                    showMonth = month;
                    showDay = day;
                    tdClass += ' this-month';
                }
                else {
                    // Show next month's dates.
                    nextMonthsDay += 1;
                    showYear = nextMonthsYear;
                    showMonth = nextMonth;
                    showDay = nextMonthsDay;
                    tdClass += ' next-month';
                }

                // Has the month being shown ended yet?
                if (day >= monthLength) {
                    monthHasEnded = true;
                }

                let td = showDay;
                let tdTitle = `${Calendar.monthNames[showMonth]} ${showDay}, ${showYear}`
                if (showDay === nowDay && showMonth === nowMonth && showYear === nowYear) {
                    tdClass += ' now';
                    tdTitle += ' (Today)';
                }

                tr += `<td class="${tdClass}" title="${tdTitle}">${td}</td>`;
            }

            if (rowCount++ === weeksInMonth) {
                trClass = ' class="last-row"';
            }

            html += `<tr${trClass}>${tr}</tr>`;
        }

        html += '</tbody></table>';

        return html;
    }

    static renderYear(year) {
        let html = '<div class="year">';

        for (let m = 0; m < 12; m++) {
            const monthURL = `?view=month&amp;year=${year}&amp;month=${m}`;
            const monthName = Calendar.monthNames[m];

            html += `<div class="month" id="month-${m}">`;
            html += `<h3><a href="${monthURL}">${monthName}<span></span></a></h3>`;
            html += Calendar.renderMonth(year, m, true);
            html += '</div>';
        }

        html += '</div>';

        return html;
    }
}

const myCalendar = new Calendar();
myCalendar.render();
