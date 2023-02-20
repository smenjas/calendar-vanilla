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
    static maxLength = 255;
    static monthLengths = {};
    static monthNames = Calendar.getMonthNames(Calendar.language);
    static weekdayNames = Calendar.getWeekdayNames(Calendar.language);

    constructor() {
        const params = new URLSearchParams(window.location.search);

        let view = params.get('view');
        let year = params.get('year');
        let month = params.get('month');
        let day = params.get('day');
        let eventID = params.get('eventID');

        if (!view) {
            view = 'month';
        }
        if (!day) {
            if (view === 'day') {
                day = Calendar.now.getDate();
                if (!month) {
                    month = Calendar.now.getMonth();
                }
            }
            else {
                day = 1;
            }
        }
        if (view === 'month' && !month) {
            month = Calendar.now.getMonth();
        }
        if (!year) {
            year = Calendar.now.getFullYear();
        }

        // Standardize the date inputs, in case the month or day is out of range.
        const date = new Date(year, month, day);

        this.query = {};
        this.query['year'] = date.getFullYear();
        this.query['month'] = date.getMonth();
        this.query['day'] = date.getDate();
        this.query['view'] = view.toLowerCase();
        this.query['eventID'] = eventID;
    }

    render() {
        const { year, month, day, view, eventID } = this.query;

        let html = '<div class="calendar">';

        switch (view) {
            case 'event':
                html += '<nav>';
                html += Calendar.renderCommonNav(view, year, month, day);
                html += '</nav>';
                html += this.renderEventForm(eventID, year, month, day);
                html += Calendar.renderEvents();
                break;
            case 'year':
                html += Calendar.renderYearNav(year, month, day);
                html += Calendar.renderYear(year, month, day);
                break;
            case 'day':
                html += Calendar.renderDayNav(year, month, day);
                html += Calendar.renderDay(year, month, day);
                break;
            default:
                html += Calendar.renderMonthNav(year, month, day);
                html += Calendar.renderMonth(year, month);
                break;
        }

        html += '</div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    static formatDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        return Calendar.formatDateParts(year, month, day);
    }

    static formatDateParts(year, month, day) {
        return `${Calendar.monthNames[month]} ${day}, ${year}`;
    }

    static handleDayNav() {
        const year = parseInt(document.getElementById('nav-year').value);
        const month = parseInt(document.getElementById('nav-month').value);
        const day = parseInt(document.getElementById('nav-day').value);
        const monthLength = Calendar.getMonthLength(year, month);

        if (day > monthLength) {
            document.getElementById('nav-day').value = monthLength;
        }

        document.querySelector('nav form').submit();
    }

    static processEvent(event, eventID) {
        const startDate = new Date(event.startYear, event.startMonth, event.startDay);
        const endDate = new Date(event.endYear, event.endMonth, event.endDay);

        if (endDate < startDate) {
            [event.startYear, event.startMonth, event.startDay] = Calendar.splitDate(endDate);
            [event.endYear, event.endMonth, event.endDay] = Calendar.splitDate(startDate);
        }

        if (event.name.length > Calendar.maxLength) {
            event.name = event.name.substring(0, Calendar.maxLength);
        }
        if (event.location.length > Calendar.maxLength) {
            event.location = event.location.substring(0, Calendar.maxLength);
        }
        if (event.url.length > Calendar.maxLength) {
            event.url = event.url.substring(0, Calendar.maxLength);
        }
        if (event.notes.length > Calendar.maxLength) {
            event.notes = event.notes.substring(0, Calendar.maxLength);
        }

        let events = JSON.parse(localStorage.getItem('events')) || [];
        let oldDateList = [];

        if (eventID === null) {
            eventID = events.length;
            events.push(event);
        }
        else {
            const oldEvent = events[eventID];
            oldDateList = Calendar.listEventDates(oldEvent);
            events[eventID] = event;
        }

        const dateList = Calendar.listEventDates(event);
        Calendar.updateEventDates(eventID, dateList, oldDateList);
        localStorage.setItem('events', JSON.stringify(events));
    }

    static listEventDates(event) {
        let offset = 0;
        let date = new Date(event.startYear, event.startMonth, event.startDay);
        const endDate = new Date(event.endYear, event.endMonth, event.endDay, 23, 59, 59);
        const dateList = [];

        while (date < endDate) {
            const iso10 = date.toISOString().substring(0, 10);
            dateList.push(iso10);
            offset += 1;
            date = new Date(event.startYear, event.startMonth, parseInt(event.startDay) + offset);
        }

        return dateList;
    }

    static updateEventDates(eventID, dateList, oldDateList = []) {
        let eventDates = JSON.parse(localStorage.getItem('eventDates')) || {};
        const removeDates = oldDateList.filter(date => !dateList.includes(date));
        const addDates = dateList.filter(date => !oldDateList.includes(date));
        console.log(eventDates);

        for (const date of removeDates) {
            if (eventDates.hasOwnProperty(date) === false) {
                console.log(`Tried to remove ${date}, not found.`);
                continue;
            }
            const index = eventDates[date].indexOf(eventID);
            if (index === -1) {
                console.log(`eventID ${eventID} not found for ${date}`);
                continue;
            }
            eventDates[date].splice(index, 1);
        }

        for (const date of addDates) {
            if (eventDates.hasOwnProperty(date) === false) {
                eventDates[date] = [];
            }
            eventDates[date].push(eventID);
        }

        localStorage.setItem('eventDates', JSON.stringify(eventDates));
    }

    static getURL(view, year, month = null, day = null) {
        let url = `?view=${view}&year=${year}`;
        url += (month !== null) ? `&month=${month}` : '';
        url += (day !== null) ? `&day=${day}` : '';
        return url;
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
        const year = Calendar.now.getFullYear();

        for (let month = 0; month < 12; month++) {
            const date = new Date(year, month, 1);
            monthNames[month] = Calendar.getMonthName(date, language, 'long');
        }

        return monthNames;
    }

    static getWeekdayName(date, language, format = 'long') {
        // See https://devhints.io/wip/intl-datetime for format options.
        return Intl.DateTimeFormat(language, { weekday: format }).format(date);
    }

    static getWeekdayNames(language) {
        const [year, month, day] = Calendar.splitDate(Calendar.now);
        const weekdayNames = [];

        for (let offset = 0; offset < 7; offset++) {
            const date = new Date(year, month, day + offset);
            weekdayNames[date.getDay()] = {
                long: Calendar.getWeekdayName(date, language, 'long'),
                short: Calendar.getWeekdayName(date, language, 'short'),
                narrow: Calendar.getWeekdayName(date, language, 'narrow')
            }
        }

        return weekdayNames;
    }

    static getDayOptions(year, month, day) {
        const monthLength = Calendar.getMonthLength(year, month);
        const days = {};

        for (let d = 1; d <= monthLength; d++) {
            days[d] = d;
        }

        return HTML.getSelectOptions(days, day);
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

    static splitDate(date) {
        // Accepts a Date object.
        //
        // Returns an array with the year, month, day, hours, minutes, seconds,
        // milliseconds, and timezone offset in minutes from UTC.

        const parts = [];
        parts.push(date.getFullYear());
        parts.push(date.getMonth());
        parts.push(date.getDate());
        parts.push(date.getHours());
        parts.push(date.getMinutes());
        parts.push(date.getSeconds());
        parts.push(date.getMilliseconds());
        parts.push(date.getTimezoneOffset());

        return parts;
    }

    renderEventForm(eventID = null, year = null, month = null, day = null) {
        const inputSize = 50;

        if (year === null) {
            [year, month, day] = Calendar.splitDate(Calendar.now);
        }
        else if (month === null) {
            [year, month, day] = Calendar.splitDate(new Date(year));
        }
        else if (day === null) {
            [year, month, day] = Calendar.splitDate(new Date(year, month));
        }

        const event = (eventID !== null && eventID !== '') ?
            JSON.parse(localStorage.getItem('events'))[eventID] :
            {
                name: '',
                startYear: year,
                startMonth: month,
                startDay: day,
                endYear: year,
                endMonth: month,
                endDay: day,
                location: '',
                url: '',
                notes: '',
            };

        if (event === undefined) {
            return `<p class="error">eventID ${eventID} not found.</p>`;
        }

        let html = '';

        if (eventID === null || eventID === '') {
            html += '<h2>Add New Event</h2>';
        }
        else {
            html += '<h2>Edit Event</h2>';
        }

        html += '<form id="event">';
        html += '<input type="hidden" name="view" value="event">';
        html += `<input type="hidden" name="year" value="${year}">`;
        html += `<input type="hidden" name="month" value="${month}">`;
        html += `<input type="hidden" name="day" value="${day}">`;

        let submitButtonText = "Add Event";
        if (eventID !== null && eventID !== '') {
            html += `<input type="hidden" name="eventID" value="${eventID}">`;
            submitButtonText = "Edit Event";
        }

        html += '<fieldset>';
        html += '<label>Event Name</label>';
        html += `<input name="event-name" value="${event.name}" size="${inputSize}" maxlength="${Calendar.maxLength}}">`;
        html += '<br>';

        html += '<label>Starts</label>';
        html += '<select name="event-startMonth">';
        html += Calendar.getMonthOptions(event.startMonth);
        html += '</select>';

        html += '<select name="event-startDay">';
        html += Calendar.getDayOptions(event.startYear, event.startMonth, event.startDay);
        html += '</select>';

        html += '<select name="event-startYear">';
        html += Calendar.getYearOptions(event.startYear);
        html += '</select>';
        html += '<br>';

        html += '<label>Ends</label>';
        html += '<select name="event-endMonth">';
        html += Calendar.getMonthOptions(event.endMonth);
        html += '</select>';

        html += '<select name="event-endDay">';
        html += Calendar.getDayOptions(event.endYear, event.endMonth, event.endDay);
        html += '</select>';

        html += '<select name="event-endYear">';
        html += Calendar.getYearOptions(event.endYear);
        html += '</select>';
        html += '<br>';

        html += '<label>Location</label>';
        html += `<input name="event-location" value="${event.location}" size="${inputSize}" maxlength="${Calendar.maxLength}}">`;
        html += '<br>';
        html += '<label>URL</label>';
        html += `<input name="event-url" value="${event.url}" size="${inputSize}" maxlength="${Calendar.maxLength}}">`;
        html += '<br>';
        html += '<label>Notes</label>';
        html += `<textarea name="event-notes" rows="5" cols="39" maxlength="${Calendar.maxLength}}">${event.notes}</textarea>`;
        html += '<br>';

        html += `<button type="submit">${submitButtonText}</button>`;
        html += '</fieldset>';
        html += '</form>';

        return html;
    }

    static renderEvents() {
        const events = JSON.parse(localStorage.getItem('events')) || [];

        if (events.length < 1) {
            return '';
        }

        let count = 1;
        let html = '<table id="events"><thead><tr>';
        html += '<th class="event-id">Event ID</th>';
        html += '<th class="event-name">Event Name</th>';
        html += '<th class="event-start">Starts</th>';
        html += '<th class="event-end">Ends</th>';
        html += '<th class="event-days">Days</th>';
        html += '</tr></thead><tbody>';

        for (let eventID = events.length - 1; eventID >= 0; eventID--) {
            const event = events[eventID];
            const dateList = Calendar.listEventDates(event);
            const eventURL = `<a href="?view=event&eventID=${eventID}">${eventID}</a>`;
            const prettyStartDate = Calendar.formatDateParts(event.startYear, event.startMonth, event.startDay);
            const prettyEndDate = Calendar.formatDateParts(event.endYear, event.endMonth, event.endDay);
            let trClass= '';

            if (count++ === events.length) {
                trClass= ' class="last-row"';
            }

            html += `<tr${trClass}>`;
            html += `<td class="event-id">${eventURL}</td>`;
            html += `<td class="event-name">${event.name}</td>`;
            html += `<td class="event-start">${prettyStartDate}</td>`;
            html += `<td class="event-end">${prettyEndDate}</td>`;
            html += `<td class="event-days">${dateList.length}</td>`;
            html += '</tr>';
        }

        html += '</tbody></table>';

        return html;
    }

    static renderCommonNav(view, year, month, day) {
        const yearURL = Calendar.getURL('year', year, month, day);
        const monthURL = Calendar.getURL('month', year, month, day);
        const dayURL = Calendar.getURL('day', year, month, day);

        const nowTitle = Calendar.formatDate(Calendar.now);
        const [nowYear, nowMonth, nowDay] = Calendar.splitDate(Calendar.now);
        const nowURL = Calendar.getURL(view, nowYear, nowMonth, nowDay);

        let addURL = Calendar.getURL('event', year, month, day);

        let html = `<a href="${yearURL}" class="this-year">Year</a>`;
        html += `<a href="${monthURL}" class="this-month">Month</a>`;
        html += `<a href="${dayURL}" class="this-day">Day</a>`;
        html += `<a href="${nowURL}" class="now" title="${nowTitle}">Now</a>`;
        html += `<a href="${addURL}" class="add" title="Add New Event">Add</a>`;

        return html;
    }

    static renderDayNav(year, month, day) {
        const yesterday = new Date(year, month, day - 1);
        const yesterdayTitle = Calendar.formatDate(yesterday);
        const [yesterdaysYear, yesterdaysMonth, yesterdaysDay] = Calendar.splitDate(yesterday);
        const yesterdayURL = Calendar.getURL('day', yesterdaysYear, yesterdaysMonth, yesterdaysDay);

        const tomorrow = new Date(year, month, day + 1);
        const tomorrowTitle = Calendar.formatDate(tomorrow);
        const [tomorrowsYear, tomorrowsMonth, tomorrowsDay] = Calendar.splitDate(tomorrow);
        const tomorrowURL = Calendar.getURL('day', tomorrowsYear, tomorrowsMonth, tomorrowsDay);

        let html = '<nav>';
        html += Calendar.renderCommonNav('day', year, month, day);

        html += '<form action="" method="get">';
        html += '<input type="hidden" name="view" value="day">';
        html += '<fieldset id="nav-calendar">';
        html += `<a href="${yesterdayURL}" title="${yesterdayTitle}" class="yesterday">&larr;</a>`;

        html += '<select name="month" id="nav-month" onchange="Calendar.handleDayNav()">';
        html += Calendar.getMonthOptions(month);
        html += '</select>';

        html += '<select name="day" id="nav-day" onchange="this.form.submit()">';
        html += Calendar.getDayOptions(year, month, day);
        html += '</select>';

        html += '<select name="year" id="nav-year" onchange="Calendar.handleDayNav()">';
        html += Calendar.getYearOptions(year);
        html += '</select>';

        html += `<a href="${tomorrowURL}" title="${tomorrowTitle}" class="tomorrow">&rarr;</a>`;
        html += '</fieldset>';
        html += '</form>';
        html += '</nav>';

        return html;
    }

    static renderMonthNav(year, month, day) {
        const lastMonthURL = Calendar.getURL('month', year, month - 1);
        const nextMonthURL = Calendar.getURL('month', year, month + 1);
        const lastYearURL = Calendar.getURL('month', year - 1, month);
        const nextYearURL = Calendar.getURL('month', year + 1, month);

        let html = '<nav>';
        html += Calendar.renderCommonNav('month', year, month, day);

        html += '<form action="" method="get">';
        html += '<input type="hidden" name="view" value="month">';
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

    static renderYearNav(year, month, day) {
        const lastYearURL = Calendar.getURL('year', year - 1);
        const nextYearURL = Calendar.getURL('year', year + 1);

        let html = '<nav>';
        html += Calendar.renderCommonNav('year', year, month, day);

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

    static renderDay(year, month, day) {
        const [nowYear, nowMonth, nowDay, nowHour] = Calendar.splitDate(Calendar.now);

        let html = '<table class="day"><thead><tr>';
        html += '<th class="time">Time</th>';
        html += '<th class="event">Events</th>';
        html += '</thead></tr>';
        html += '<tbody>';

        for (let hour = 0; hour < 24; hour++) {
            let trClass = '';
            if (hour === nowHour && day === nowDay
                && month === nowMonth && year == nowYear) {
                trClass = ' now';
            }
            html += `<tr class="time-${hour}${trClass}">`;
            html += `<td class="time">${hour}:00</td>`;
            html += `<td class="event"></td>`;
            html += '</tr>';
        }

        html += '</tbody></table>';

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

        const [nowYear, nowMonth, nowDay] = Calendar.splitDate(Calendar.now);

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
        let monthHasBegun = false;
        let monthHasEnded = false;
        let rowCount = 1;
        let trClass = '';

        while (monthHasEnded === false) {
            let tr = '';

            for (let weekday = 0; weekday < 7; weekday++) {
                let showYear = '';
                let showMonth = '';
                let tdClass = `weekday-${weekday}`

                // Has the month being shown started yet?
                if (monthHasBegun === false && monthStartsOn === weekday) {
                    monthHasBegun = true;
                    day = 0;
                }

                // Which month are we in?
                if (monthHasBegun === false) {
                    // Show last month's dates.
                    const offset = monthStartsOn - (weekday + 1);
                    day = lastMonthsLength - offset;
                    showYear = lastMonthsYear;
                    showMonth = lastMonth;
                    tdClass += ' last-month';
                }
                else if (monthHasEnded === false) {
                    // Show this month's dates.
                    day += 1;
                    showYear = year;
                    showMonth = month;
                    tdClass += ' this-month';
                }
                else {
                    // Show next month's dates.
                    day += 1;
                    showYear = nextMonthsYear;
                    showMonth = nextMonth;
                    tdClass += ' next-month';
                }

                let td = `${day}`;
                if (small === false) {
                    const dateURL = Calendar.getURL('day', showYear, showMonth, day);
                    td = `<a href="${dateURL}">${day}<span></span></a>`;
                }

                let tdTitle = Calendar.formatDateParts(showYear, showMonth, day);
                if (day === nowDay && showMonth === nowMonth && showYear === nowYear) {
                    tdClass += ' now';
                    tdTitle += ' (Today)';
                }

                // Has the month being shown ended yet?
                if (monthHasBegun === true && day >= monthLength) {
                    monthHasEnded = true;
                    day = 0;
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

    static renderYear(year, month, day) {
        month = parseInt(month);
        let html = '<div class="year">';

        for (let m = 0; m < 12; m++) {
            const d = (m === month) ? day : 1;
            const monthURL = Calendar.getURL('month', year, m, d);
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

/*
localStorage.setItem('events', '[]'); // Clear all events.
localStorage.setItem('eventDates', '{}'); // Clear all events.
*/

const form = document.querySelector('form#event');
if (form !== null) {
    form.onsubmit = (submitEvent) => {
        submitEvent.preventDefault();
        let event = {};
        const eventIDInput = form.querySelector('[name="eventID"]');
        const eventID = (eventIDInput === null) ? null : eventIDInput.value;
        form.querySelectorAll('[name]').forEach(input => {
            if (input.name.substring(0, 6) === 'event-') {
                const key = input.name.substring(6);
                event[key] = input.value;
            }
        });
        Calendar.processEvent(event, eventID);
        location.reload();
    }
}
