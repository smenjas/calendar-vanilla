class HTML {
    static getSelectOptions(options, selected) {
        if (selected === null || selected in {undefined, NaN}) {
            selected = '';
        }

        let html = '';

        if (options instanceof Map) {
            for (const [option, text] of options) {
                const s = (`${option}` === `${selected}`) ? ' selected' : '';
                html += `<option value="${option}"${s}>${text}</option>`;
            }
        }
        else {
            for (const option in options) {
                const text = options[option];
                const s = (`${option}` === `${selected}`) ? ' selected' : '';
                html += `<option value="${option}"${s}>${text}</option>`;
            }
        }

        return html;
    }
}

class Calendar {
    static categories = JSON.parse(localStorage.getItem('categories')) || [];
    static eventDates = JSON.parse(localStorage.getItem('eventDates')) || {};
    static events = JSON.parse(localStorage.getItem('events')) || [];
    static now = new Date();
    static language = 'en-us';
    static maxLength = 255;
    static maxLengthColor = 7;
    static monthLengths = {};
    static monthNames = Calendar.getMonthNames(Calendar.language);
    static weekdayNames = Calendar.getWeekdayNames(Calendar.language);
    static colorPattern = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

    constructor() {
        const params = new URLSearchParams(window.location.search);

        let view = params.get('view');
        let year = params.get('year');
        let month = params.get('month');
        let day = params.get('day');
        let categoryID = params.get('categoryID');
        let eventID = params.get('eventID');

        if (!view) {
            view = 'month';
        }
        if (!day) {
            if (!month) {
                month = Calendar.now.getMonth();
                day = Calendar.now.getDate();
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
        this.query['categoryID'] = categoryID;
        this.query['eventID'] = eventID;

        this.render();
        Calendar.processCategoryForm();
        Calendar.validateCategoryForm();
        Calendar.processEventForm();
    }

    render() {
        const { year, month, day, view, categoryID, eventID } = this.query;

        let html = '<div class="calendar">';

        switch (view) {
            case 'category':
                html += '<nav>';
                html += Calendar.renderCommonNav(view, year, month, day);
                html += '</nav>';
                html += this.renderCategoryForm(categoryID, year, month, day);
                html += Calendar.renderCategories();
                break;
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

    static deleteCategory(categoryID) {
        const category = Calendar.categories[categoryID];
        Calendar.categories.splice(categoryID, 1);
        localStorage.setItem('categories', JSON.stringify(Calendar.categories));
    }

    static deleteEvent(eventID) {
        const event = Calendar.events[eventID];
        const dateList = Calendar.listEventDates(event);
        Calendar.updateEventDates(eventID, [], dateList);
        Calendar.events.splice(eventID, 1);
        localStorage.setItem('events', JSON.stringify(Calendar.events));

        for (const date in Calendar.eventDates) {
            for (const index in Calendar.eventDates[date]) {
                if (Calendar.eventDates[date][index] > eventID) {
                    console.log('Decrementing eventID:', Calendar.eventDates[date][index]);
                    Calendar.eventDates[date][index] -= 1;
                }
            }
        }
        localStorage.setItem('eventDates', JSON.stringify(Calendar.eventDates));
    }

    static processCategory(category, categoryID) {
        category.name = category.name.trim();
        if (category.name === '') {
            return;
        }

        if (category.name.length > Calendar.maxLength) {
            category.name = category.name.substring(0, Calendar.maxLength);
        }
        category.color = category.color.trim();
        if (category.color.length > Calendar.maxLengthColor) {
            category.color = category.color.substring(0, Calendar.maxLengthColor);
        }
        if (!Calendar.colorPattern.test(category.color)) {
            return;
        }

        if (categoryID === null) {
            categoryID = Calendar.categories.length;
            Calendar.categories.push(category);
        }
        else {
            const oldCategory = Calendar.categories[categoryID];
            Calendar.categories[categoryID] = category;
        }

        localStorage.setItem('categories', JSON.stringify(Calendar.categories));
    }

    static processCategoryForm() {
        const form = document.querySelector('form#category');

        if (form === null) {
            return;
        }

        form.onsubmit = (submitEvent) => {
            submitEvent.preventDefault();
            const category = {};
            const categoryIDInput = form.querySelector('[name="categoryID"]');
            const categoryID = (categoryIDInput === null) ? null : parseInt(categoryIDInput.value);
            const deleteButton = form.querySelector('button[name="delete"]');
            if (submitEvent.submitter === deleteButton) {
                Calendar.deleteCategory(categoryID);
            }
            else {
                form.querySelectorAll('[name]').forEach(input => {
                    if (input.name.substring(0, 9) === 'category-') {
                        const key = input.name.substring(9);
                        category[key] = input.value;
                    }
                });
                Calendar.processCategory(category, categoryID);
            }
            location.reload();
        }
    }

    static validateCategoryForm() {
        const form = document.querySelector('form#category');

        if (form === null) {
            return;
        }

        const colorInput = form.querySelector('[name="category-color"]');
        colorInput.addEventListener('input', event => {
            if (Calendar.colorPattern.test(colorInput.value)) {
                colorInput.style.backgroundColor = '#eee';
            }
            else {
                colorInput.style.backgroundColor = '#f88';
            }
        });
    }

    static processEvent(event, eventID) {
        event.name = event.name.trim();
        if (event.name === '') {
            return;
        }

        const startDate = new Date(event.startYear, event.startMonth, event.startDay);
        const endDate = new Date(event.endYear, event.endMonth, event.endDay);

        if (endDate < startDate) {
            [event.startYear, event.startMonth, event.startDay] = Calendar.splitDate(endDate);
            [event.endYear, event.endMonth, event.endDay] = Calendar.splitDate(startDate);
        }

        if (event.name.length > Calendar.maxLength) {
            event.name = event.name.substring(0, Calendar.maxLength);
        }
        event.location = event.location.trim();
        if (event.location.length > Calendar.maxLength) {
            event.location = event.location.substring(0, Calendar.maxLength);
        }
        event.url = event.url.trim();
        if (event.url.length > Calendar.maxLength) {
            event.url = event.url.substring(0, Calendar.maxLength);
        }
        event.notes = event.notes.trim();
        if (event.notes.length > Calendar.maxLength) {
            event.notes = event.notes.substring(0, Calendar.maxLength);
        }

        let oldDateList = [];

        if (eventID === null) {
            eventID = Calendar.events.length;
            Calendar.events.push(event);
        }
        else {
            const oldEvent = Calendar.events[eventID];
            oldDateList = Calendar.listEventDates(oldEvent);
            Calendar.events[eventID] = event;
        }

        const dateList = Calendar.listEventDates(event);
        Calendar.updateEventDates(eventID, dateList, oldDateList);
        localStorage.setItem('events', JSON.stringify(Calendar.events));
    }

    static processEventForm() {
        const form = document.querySelector('form#event');

        if (form === null) {
            return;
        }

        form.onsubmit = (submitEvent) => {
            submitEvent.preventDefault();
            const event = {};
            const eventIDInput = form.querySelector('[name="eventID"]');
            const eventID = (eventIDInput === null) ? null : parseInt(eventIDInput.value);
            const deleteButton = form.querySelector('button[name="delete"]');
            if (submitEvent.submitter === deleteButton) {
                Calendar.deleteEvent(eventID);
            }
            else {
                form.querySelectorAll('[name]').forEach(input => {
                    if (input.name.substring(0, 6) === 'event-') {
                        const key = input.name.substring(6);
                        event[key] = input.value;
                    }
                });
                event.completed = form.querySelector('[name="event-completed"]').checked;
                Calendar.processEvent(event, eventID);
            }
            location.reload();
        }
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
        eventID = parseInt(eventID);
        const removeDates = oldDateList.filter(date => !dateList.includes(date));
        const addDates = dateList.filter(date => !oldDateList.includes(date));

        for (const date of removeDates) {
            if (Object.hasOwn(Calendar.eventDates, date) === false) {
                console.log(`Date ${date} not found for eventID ${eventID}`);
                continue;
            }
            const index = Calendar.eventDates[date].indexOf(eventID);
            if (index === -1) {
                console.log(`eventID ${eventID} not found for ${date}`);
                continue;
            }
            console.log(`Deleting eventID ${eventID} from ${date}`);
            Calendar.eventDates[date].splice(index, 1);
        }

        for (const date of addDates) {
            if (Object.hasOwn(Calendar.eventDates, date) === false) {
                Calendar.eventDates[date] = [];
            }
            else {
                const index = Calendar.eventDates[date].indexOf(eventID);
                if (index !== -1) {
                    console.log(`eventID ${eventID} already exists for ${date}`);
                    continue;
                }
            }
            Calendar.eventDates[date].push(eventID);
            console.log(`Adding eventID ${eventID} for ${date}`);
        }

        localStorage.setItem('eventDates', JSON.stringify(Calendar.eventDates));
    }

    static getURL(view, year, month = null, day = null) {
        let url = `?view=${view}&year=${year}`;
        url += (month !== null) ? `&month=${month}` : '';
        url += (day !== null) ? `&day=${day}` : '';
        return url;
    }

    static getMonthLength(year, month) {
        if (Object.hasOwn(Calendar.monthLengths, year) === false) {
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

    static getCategoryOptions(category) {
        const options = new Map();
        options.set(-1, 'None');
        Calendar.categories.forEach((category, categoryID) => {
            options.set(categoryID, category.name);
        });
        return HTML.getSelectOptions(options, category);
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

    renderCategoryForm(categoryID = null, year = null, month = null, day = null) {
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

        const category = (categoryID !== null && categoryID !== '' && Calendar.categories !== null) ?
            Calendar.categories[categoryID] :
            {
                name: '',
                color: '',
            };

        if (category === undefined) {
            return `<p class="error">categoryID ${categoryID} not found.</p>`;
        }

        let html = '';

        if (categoryID === null || categoryID === '') {
            html += '<h2>Add New Event Category</h2>';
        }
        else {
            html += '<h2>Edit Event Category</h2>';
        }

        html += '<form id="category">';
        html += '<input type="hidden" name="view" value="category">';
        html += `<input type="hidden" name="year" value="${year}">`;
        html += `<input type="hidden" name="month" value="${month}">`;
        html += `<input type="hidden" name="day" value="${day}">`;

        let submitButtonText = "Add Event Category";
        if (categoryID !== null && categoryID !== '') {
            html += `<input type="hidden" name="categoryID" value="${categoryID}">`;
            submitButtonText = "Edit Event Category";
        }

        html += '<fieldset>';
        html += '<label>Name</label>';
        html += `<input name="category-name" value="${category.name}" size="${inputSize}" maxlength="${Calendar.maxLength}}" required autofocus>`;
        html += '<br>';

        html += '<label>Color</label>';
        html += `<input name="category-color" value="${category.color}" size="${Calendar.maxLengthColor}" maxlength="${Calendar.maxLengthColor}}">`;
        html += '<br>';

        html += `<button type="submit">${submitButtonText}</button>`;

        if (categoryID !== null && categoryID !== '') {
            html += `<button type="submit" name="delete" class="delete">Delete Event Category</button>`;
        }

        html += '</fieldset>';
        html += '</form>';

        return html;
    }

    static renderCategories() {
        if (Calendar.categories.length < 1) {
            return '';
        }

        let count = 1;
        let html = '<table id="category"><thead><tr>';
        html += '<th class="category-id">Category ID</th>';
        html += '<th class="category-name">Category Name</th>';
        html += '<th class="category-color" colspan="2">Color</th>';
        html += '</tr></thead><tbody>';

        for (let categoryID = Calendar.categories.length - 1; categoryID >= 0; categoryID--) {
            const category = Calendar.categories[categoryID];
            const categoryURL = `<a href="?view=category&categoryID=${categoryID}">${categoryID}</a>`;
            let trClass= '';

            if (count++ === Calendar.categories.length) {
                trClass= ' class="last-row"';
            }

            html += `<tr${trClass}>`;
            html += `<td class="category-id">${categoryURL}</td>`;
            html += `<td class="category-name">${category.name}</td>`;
            html += `<td class="category-color-code">${category.color}</td>`;
            html += `<td class="category-color" style="background-color: ${category.color}" title="${category.color}"></td>`;
            html += '</tr>';
        }

        html += '</tbody></table>';

        return html;
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

        const event = (eventID !== null && eventID !== '' && Calendar.events !== null) ?
            Calendar.events[eventID] :
            {
                name: '',
                category: -1,
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
        html += `<input name="event-name" value="${event.name}" size="${inputSize}" maxlength="${Calendar.maxLength}}" required autofocus>`;
        html += '<br>';

        html += '<label>Category</label>';
        html += '<select name="event-category">';
        html += Calendar.getCategoryOptions(event.category);
        html += '</select>';
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

        if (event.location.length > 0) {
            const locationURL = "https://www.google.com/maps/place/" + encodeURIComponent(event.location);
            html += `<label><a href="${locationURL}" target="_blank">Location</a></label>`;
        }
        else {
            html += '<label>Location</label>';
        }
        html += `<input name="event-location" value="${event.location}" size="${inputSize}" maxlength="${Calendar.maxLength}}">`;
        html += '<br>';

        if (event.url.length > 0) {
            html += `<label><a href="${event.url}" target="_blank">URL</a></label>`;
        }
        else {
            html += '<label>URL</label>';
        }
        html += `<input name="event-url" value="${event.url}" size="${inputSize}" maxlength="${Calendar.maxLength}}">`;
        html += '<br>';

        html += '<label>Notes</label>';
        html += `<textarea name="event-notes" rows="5" cols="39" maxlength="${Calendar.maxLength}}">${event.notes}</textarea>`;
        html += '<br>';

        const checked = (event.completed === true) ? ' checked' : '';
        html += '<label>Completed</label>';
        html += `<input type="checkbox" name="event-completed"${checked}>`;
        html += '<br>';

        html += `<button type="submit">${submitButtonText}</button>`;

        if (eventID !== null && eventID !== '') {
            html += `<button type="submit" name="delete" class="delete">Delete Event</button>`;
        }

        html += '</fieldset>';
        html += '</form>';

        return html;
    }

    static renderEvents() {
        if (Calendar.events.length < 1) {
            return '';
        }

        let count = 1;
        let html = '<table id="events"><thead><tr>';
        html += '<th class="event-id">Event ID</th>';
        html += '<th class="event-name">Event Name</th>';
        html += '<th class="event-category">Category</th>';
        html += '<th class="event-start">Starts</th>';
        html += '<th class="event-end">Ends</th>';
        html += '<th class="event-days">Days</th>';
        html += '</tr></thead><tbody>';

        for (let eventID = Calendar.events.length - 1; eventID >= 0; eventID--) {
            const event = Calendar.events[eventID];
            const dateList = Calendar.listEventDates(event);
            const eventURL = `<a href="?view=event&eventID=${eventID}">${eventID}</a>`;
            const prettyStartDate = Calendar.formatDateParts(event.startYear, event.startMonth, event.startDay);
            const prettyEndDate = Calendar.formatDateParts(event.endYear, event.endMonth, event.endDay);
            const category = (event.category in Calendar.categories) ? Calendar.categories[event.category].name : 'None';
            const trClass = (count++ === Calendar.events.length) ? ' class="last-row"' : '';

            html += `<tr${trClass}>`;
            html += `<td class="event-id">${eventURL}</td>`;
            html += `<td class="event-name">${event.name}</td>`;
            html += `<td class="event-category">${category}</td>`;
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

        const eventURL = Calendar.getURL('event', year, month, day);
        const categoryURL = Calendar.getURL('category', year, month, day);

        let html = `<a href="${yearURL}" class="this-year">Year</a>`;
        html += `<a href="${monthURL}" class="this-month">Month</a>`;
        html += `<a href="${dayURL}" class="this-day">Day</a>`;
        html += `<a href="${nowURL}" class="now" title="${nowTitle}">Now</a>`;
        html += `<a href="${eventURL}" class="add" title="Add New Event">Events</a>`;
        html += `<a href="${categoryURL}" class="add" title="Add New Category">Categories</a>`;

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

        html += '<form>';
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

        html += '<form>';
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

        html += '<form>';
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
        const date = new Date(year, month, day);
        const iso10 = date.toISOString().substring(0, 10);
        const eventIDs = Calendar.eventDates[iso10];
        const [nowYear, nowMonth, nowDay, nowHour] = Calendar.splitDate(Calendar.now);

        let html = '<table class="day"><thead><tr>';
        html += '<th class="time">Time</th>';
        html += '<th class="event">Events</th>';
        html += '</thead></tr>';
        html += '<tbody>';

        let eventStarted = false;
        for (let hour = 0; hour < 24; hour++) {
            let trClass = '';
            if (hour === nowHour && day === nowDay
                && month === nowMonth && year == nowYear) {
                trClass = ' now';
            }
            html += `<tr class="time-${hour}${trClass}">`;
            html += `<td class="time">${hour}:00</td>`;

            if (eventIDs === undefined || eventIDs.length < 1) {
                html += `<td class="event"></td>`;
            }
            else if (eventStarted === false) {
                eventStarted = true;
                let eventsList = '<ul>';
                eventIDs.forEach(eventID => {
                    const event = Calendar.events[eventID];
                    const eventURL = `?view=event&eventID=${eventID}`
                    const eventLink = `<a href="${eventURL}" title="${event.notes}">${event.name}</a>`;
                    const checked = (event.completed) ? ' checked' : '';
                    const checkboxTitle = (event.completed) ? 'Completed' : 'Not completed';
                    const checkbox = `<input type="checkbox" title="${checkboxTitle}" disabled${checked}>`;
                    eventsList += `<li>${checkbox} ${eventLink}</li>`;
                });
                eventsList += '</ul>';
                html += `<td class="event" rowspan="24">${eventsList}</td>`;
            }

            html += '</tr>';
        }

        html += '</tbody></table>';

        return html;
    }

    static renderMonth(year, month, small = false) {
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
        const monthLength = Calendar.getMonthLength(year, month);
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

                let date = new Date(showYear, showMonth, day);
                const iso10 = date.toISOString().substring(0, 10);
                const eventIDs = Calendar.eventDates[iso10];

                let td = day;
                if (small === false && eventIDs !== undefined && eventIDs.length > 0) {
                    let eventsText = eventIDs.length;
                    eventsText += (eventIDs.length === 1) ? " event" : " events";
                    td += `<p class="events">${eventsText}</p>`;
                }
                if (small === false) {
                    const dateURL = Calendar.getURL('day', showYear, showMonth, day);
                    td = `<a href="${dateURL}">${td}<span></span></a>`;
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

/*
localStorage.setItem('events', '[]');
localStorage.setItem('eventDates', '{}');
*/

new Calendar();
