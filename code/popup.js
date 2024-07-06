
let pujsLoadedIcons = {};

let pujs = {
    getCssRule: function (selectorText) {
        let i;
        for (i = 0; i < document.styleSheets.length; i += 1) {
            let sheet = document.styleSheets[i];
            let j;
            for (j = 0; j < sheet.cssRules.length; j += 1) {
                let rule = sheet.cssRules[j];
                if (rule.selectorText === selectorText) {
                    return rule;
                }
            }
        }
        return null;
    },
    setup: {
        body_scrollable: true,
        original: {
            position: '',
            height: '',
            top: '',
            overflow: '',
            width: '',
            overflowX: '',
            overflowY: '',
            scroll: 0,
            scrollLeft: 0
        },
        icons_path: './icons/',
        init: function () {
            if (document.getElementsByClassName('alert').length === 0) {
                let Alert = document.createElement('div');
                Alert.classList.add('pujs-alert');
                let AlertIcon = document.createElement('div');
                AlertIcon.classList.add('alert-icon');
                Alert.appendChild(AlertIcon);
                let AlertText = document.createElement('div');
                AlertText.classList.add('alert-text');
                Alert.appendChild(AlertText);
                document.body.appendChild(Alert);
            }
            puJSPreloadIcons(['close', 'check']);

            if (!document.querySelector('.puJS-fullscreen-cover')) {
                let FullscreenCover = document.createElement('div');
                FullscreenCover.classList.add('puJS-fullscreen-cover');
                document.body.appendChild(FullscreenCover);
            }
        },
        todo: {
            alert: {
                start: function () { return false; },
                end: function () { return false; }
            },
            popup: {
                start: function () { return false; },
                end: function () { return false; }
            },
            pullOut: {
                start: function () { return false; },
                end: function () { return false; }
            }
        }
    }
};

// Replace all <icon> to <svg>
let puJS_icon_holders = document.getElementsByTagName('icon');
async function puJSIcons() {
    if (puJS_icon_holders.length === 0) {
        return;
    }
    let icon = puJS_icon_holders[0].getAttribute('data-icon');
    let icon_element = puJS_icon_holders[0];
    let icon_parent = icon_element.parentElement;
    let svgUrl = `${pujs.setup.icons_path}/${icon}.svg`;
    if (!pujsLoadedIcons[icon]) {
        await fetch(svgUrl)
            .then((response) => response.text())
            .then((svg) => {
                let span = document.createElement('span');
                span.innerHTML = svg;
                let icon_class = icon_element.getAttribute('class');
                span.setAttribute('class', icon_class);
                span.setAttribute('style', '--mask-i: url(' + svgUrl + ')');
                try { icon_parent.replaceChild(span, icon_element); } catch { }
                puJSIcons();
                pujsLoadedIcons[icon] = svg;
            });
    } else {
        let span = document.createElement('span');
        span.innerHTML = pujsLoadedIcons[icon];
        let icon_class = icon_element.getAttribute('class');
        span.setAttribute('class', icon_class);
        span.setAttribute('style', '--mask-i: url(' + svgUrl + ')');
        try { icon_parent.replaceChild(span, icon_element); } catch { }
        puJSIcons();
    }
}

puJSIcons();

function puJSPreloadIcons(a = []) {
    a.forEach((icon) => {
        fetch(`${pujs.setup.icons_path}/${icon}.svg`)
            .then((response) => response.text())
            .then((svg) => {
                pujsLoadedIcons[icon] = svg;
            });
    });
}

pujs.pullOutAlerts = [];

pujs.pullOutTouch = {
    start_x: 0,
    start_y: 0,
    time: 0,
    done: () => {
        pujs.setup.todo.pullOut.end();
        if (pujs.pullOutAlerts.length === 0) {
            if (pujs.setup.body_scrollable) {
                document.body.style.position = pujs.setup.original.position;
                document.body.style.top = pujs.setup.original.top;
                document.body.style.height = pujs.setup.original.height;
                document.body.style.width = pujs.setup.original.width;
                document.body.style.overflow = pujs.setup.original.overflow;
                document.body.style.overflowX = pujs.setup.original.overflowX;
                document.body.style.overflowY = pujs.setup.original.overflowY;
                window.scrollTo(pujs.setup.original.scrollLeft, pujs.setup.original.scroll);
            }
        }
    }
};

document.body.addEventListener('click', function (e) {
    const t = e.target;

    let containspoAlert = false;

    let T = t;
    try {
        while (T.nodeName !== 'BODY') {
            if (T.classList.contains('pujs-poAlert')) {
                containspoAlert = true;
                break;
            }
            T = T.parentNode;
        }
    } catch { }

    if (!containspoAlert && pujs.pullOutAlerts.length) {
        pujs.pullOutAlerts[pujs.pullOutAlerts.length - 1].style.animation = 'pujsPoAlertSlideOut .5s';
        // remove from array
        try {
            let id = pujs.pullOutAlerts[pujs.pullOutAlerts.length - 1].id;
            if (id) {
                // remove id from pujs.pullOutAlerts
                let index = pujs.pullOutAlerts.indexOf(id);
                if (index > -1) {
                    pujs.pullOutAlerts.splice(index, 1);
                }
            }

            setTimeout(() => {
                pujs.pullOutAlerts[pujs.pullOutAlerts.length - 1].remove();

                pujs.pullOutAlerts.pop();

                pujs.pullOutTouch.done();
            }, 500);
        } catch { }
    }
});

document.body.addEventListener('touchstart', function (e) {
    if (e.target.className === 'pujs-poAlert') {
        pujs.pullOutTouch.start_x = e.touches[0].clientX;
        pujs.pullOutTouch.start_y = e.touches[0].clientY;
        pujs.pullOutTouch.time = Date.now();
    }
});

document.body.addEventListener('touchmove', function (e) {
    if (e.target.className === 'pujs-poAlert') {
        let y = e.touches[0].clientY;
        let dy = y - pujs.pullOutTouch.start_y;
        let percentage = dy / window.innerHeight * 100;
        e.target.style.transform = 'translateY(' + Math.max(percentage, 0) + '%)';
        e.target.style.willChange = 'transform';
        e.target.style.transition = 'none';
    }
});

document.body.addEventListener('touchend', function (e) {
    if (e.target.className === 'pujs-poAlert') {
        // if the alert is moved more than 50% of the screen, remove the alert
        if (pujs.pullOutAlerts.includes(e.target.id)) {
            // remove from array
            let index = pujs.toggledPullOut.indexOf(e.target.id);
            if (index > -1) {
                pujs.toggledPullOut.splice(index, 1);
            }
        }
        let y = e.changedTouches[0].clientY;
        let dy = y - pujs.pullOutTouch.start_y;
        let percentage = dy / window.innerHeight * 100;

        let timeDifference = Date.now() - pujs.pullOutTouch.time;

        let ppt = (percentage / timeDifference > 0.26);
        if (percentage > 30 || ppt) {
            e.target.style.transition = 'transform 0.5s';
            e.target.style.transform = 'translateY(100%)';
            setTimeout(() => {
                e.target.remove();
                pujs.pullOutAlerts.pop();
                pujs.pullOutTouch.done();
            }, 500);
        } else {
            e.target.style.transition = 'transform 0.5s';
            e.target.style.transform = 'translateY(0)';
        }
    }
});

pujs.pullOut = (html = '', scroll = false, id = undefined) => {
    pujs.setup.todo.pullOut.start();
    setTimeout(() => {
        let a = document.createElement('div');
        a.innerHTML = html;
        a.className = 'pujs-poAlert';
        if (scroll) {
            a.style.display = 'block';
            a.style.overflowY = 'scroll';
        }

        if (id) { a.id = id; }
        if (pujs.setup.body_scrollable) {

            let scrollbar_width = window.innerWidth - document.documentElement.clientWidth;

            pujs.setup.original.scroll = window.scrollY || 0;
            pujs.setup.original.scrollLeft = window.scrollX || 0;
            pujs.setup.original.height = pujs.getCssRule('body').style.height || 'auto';
            pujs.setup.original.width = pujs.getCssRule('body').style.width || 'auto';
            pujs.setup.original.overflow = pujs.getCssRule('body').style.overflow || 'auto';
            pujs.setup.original.overflowX = pujs.getCssRule('body').style.overflowX || 'auto';
            pujs.setup.original.overflowY = pujs.getCssRule('body').style.overflowY || 'auto';
            pujs.setup.original.position = pujs.getCssRule('body').style.position || 'static';
            pujs.setup.original.top = pujs.getCssRule('body').style.top || 0;
            pujs.setup.original.right = pujs.getCssRule('body').style.right || 0;

            document.body.style.position = 'fixed';
            document.body.style.top = '-' + pujs.setup.original.scroll + 'px';
            document.body.style.height = '100vh';
            document.body.style.width = `calc(100vw - ${scrollbar_width + 'px'})`;
            document.body.style.right = scrollbar_width + 'px';
            document.body.style.overflow = 'hidden';
        }

        document.body.appendChild(a);
        pujs.pullOutAlerts.push(a);
    }, 1);
};

let puJSAlertTO;

pujs.alert = (m = '', t = 'error', T = 3000, S = false) => {
    pujs.setup.todo.alert.start();
    if (document.getElementsByClassName('alert').length === 0) {
        let Alert = document.createElement('div');
        Alert.classList.add('pujs-alert');
        let AlertIcon = document.createElement('div');
        AlertIcon.classList.add('alert-icon');
        Alert.appendChild(AlertIcon);
        let AlertText = document.createElement('div');
        AlertText.classList.add('alert-text');
        Alert.appendChild(AlertText);
        document.body.appendChild(Alert);
    }

    if (puJSAlertTO) { clearTimeout(puJSAlertTO); }

    if (S) {
        document.querySelector('.alert-text').style.userSelect = 'text';
        document.querySelector('.alert-text').style.pointerEvents = 'auto';
    } else {
        document.querySelector('.alert-text').style.userSelect = 'none';
        document.querySelector('.alert-text').style.pointerEvents = 'none';
    }
    let type_list = {
        error: {
            i: 'close',
            c: 'color-red'
        },
        success: {
            i: 'check',
            c: 'bg-green'
        }
    };

    let icon;

    if (type_list[t]) { icon = type_list[t].i || 'close'; }
    else { icon = t; }


    document.querySelector('.alert-icon').innerHTML = `<icon data-icon='${icon}' class='alert-icon stroke ${(type_list[t] ? type_list[t].c : '')}'></icon>`;
    document.querySelector('.alert-text').innerHTML = m;

    puJSIcons();

    document.querySelector('.pujs-alert').classList.add('show');

    puJSAlertTO = setTimeout(() => {
        document.querySelector('.pujs-alert').classList.remove('show');
        pujs.setup.todo.alert.end();
    }, T);
};

pujs.popup = (title = '', message = '', buttons = [{ 'text': 'OK', callback: () => { } }], button_type = 'vert', input = undefined) => {
    if (!document.querySelector('.puJS-fullscreen-cover')) {
        let FullscreenCover = document.createElement('div');
        FullscreenCover.classList.add('puJS-fullscreen-cover');
        document.body.appendChild(FullscreenCover);
    }

    document.querySelector('.puJS-fullscreen-cover').style.opacity = 1;
    document.querySelector('.puJS-fullscreen-cover').style.pointerEvents = 'all';

    let popup = document.createElement('div');
    popup.classList.add('puJS-popup');

    let inp = '';

    if (input) {
        let inputElement = document.createElement('input');
        inputElement.classList.add('input');
        inputElement.classList.add('pujs-popup-inp');
        inputElement.placeholder = input.placeholder || '';
        inputElement.value = input.value || '';
        inputElement.type = input.type || 'text';
        inp = inputElement.outerHTML;
    }

    popup.innerHTML = `<div class='puJS-popup-container'><div class='padding'><div class='title'>${title}</div><div class='message'>${message}</div>${inp}</div><div class='buttons'></div></div>`;
    if (button_type === 'vert') {
        buttons.forEach((w) => {
            let button = document.createElement('button');
            button.classList.add('puJS-popup-button');
            button.innerHTML = w.text;
            if (w.color) { button.style.color = w.color; }
            button.addEventListener('click', w.callback);
            button.addEventListener('click', (e) => {
                pujs.setup.todo.popup.end();
                if (input) {
                    pujs.popup.value = document.querySelector('.pujs-popup-inp').value;
                }
                e.target.parentElement.parentElement.remove();
                document.querySelector('.puJS-fullscreen-cover').style.opacity = 0;
                document.querySelector('.puJS-fullscreen-cover').style.pointerEvents = 'none';
            });
            popup.querySelector('.buttons').appendChild(button);
        });
    } else {
        let buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        let i;
        for (i = 0; i < 2; i += 1) {
            let button = document.createElement('button');
            button.classList.add('puJS-popup-button');
            button.innerHTML = buttons[i].text;
            if (buttons[i].color) {
                button.style.color = buttons[i].color;
            }
            button.addEventListener('click', buttons[i].callback);
            button.addEventListener('click', (e) => {
                pujs.setup.todo.popup.end();
                if (input) {
                    pujs.popup.value = document.querySelector('.pujs-popup-inp').value;
                }
                e.target.parentElement.parentElement.parentElement.remove();
                document.querySelector('.puJS-fullscreen-cover').style.opacity = 0;
                document.querySelector('.puJS-fullscreen-cover').style.pointerEvents = 'none';
            });
            buttonContainer.appendChild(button);
        }
        popup.querySelector('.buttons').appendChild(buttonContainer);
    }

    popup.querySelector('button').classList.add('emphasized');

    document.body.appendChild(popup);
};