/* Feedback reminder for your application
 *
 * Copyright (C) 2016 Tkachenko Andrey
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

var TAG = "com.falkolab.rateme",
    USAGE_TIMEOUT_KEY = TAG + ".timeout",
    LAUNCH_COUNTER_KEY = TAG + ".launches",
    OFF_KEY = TAG + '.off',
    CRASHED_KEY = TAG + '.crashed',
    // initial launch of app
    initialLaunchPerformed = false,

    promptDelay = 0, // seconds
    timeUntilPrompt = 0, // seconds
    launchesUntilPrompt = 0, // run times of app
    showIfAppHasCrashed = true,

    timerInterval = 60, // seconds
    _timer,
    _dialogTimeout;

Ti.App.addEventListener('uncaughtException', function() {
    Ti.App.Properties.setBool(CRASHED_KEY, true);
});

if(Titanium.Platform.osname == 'android') {
    exports.storeName = 'Google Play';
} else if(Titanium.Platform.osname == 'iphone') {
    exports.storeName = 'App Store';
} else {
    exports.storeName = 'Store';
}

/**
 * Rater module initializer
 * @param {Object} opts configuraion object.
 * @param {number} opts.promptDelay delay before show reminder dialog (seconds).
 * @param {number} opts.timeUntilPrompt app run time in seconds before show reminder dialog.
 * @param {number} opts.launchesUntilPrompt app launch times before show reminder dialog.
 * @param {number} opts.timerInterval internal timer period in seconds.
 * @param {bool} opts.showIfAppHasCrashed whether or not to show reminder dialog if app was crashed before.
 */
exports.init = function(opts) {
    if(!_.isUndefined(opts.promptDelay)) {
        promptDelay = opts.promptDelay;
    }

    if(!_.isUndefined(opts.timerInterval)) {
        timerInterval = opts.timerInterval;
    }

    if(!_.isUndefined(opts.showIfAppHasCrashed)) {
        showIfAppHasCrashed = opts.showIfAppHasCrashed;
    }

    // app usage timeout in minutes
    if(!_.isUndefined(opts.timeUntilPrompt)) {
        timeUntilPrompt = opts.timeUntilPrompt;
        if(this.getRemainedTimeout() === 0) {
            Ti.App.Properties.setInt(USAGE_TIMEOUT_KEY, timeUntilPrompt);
        }
    }

    if(!_.isUndefined(opts.launchesUntilPrompt)) {
        launchesUntilPrompt = opts.launchesUntilPrompt;

        if(this.getLaunchesUntilPrompt() === 0) {
            Ti.App.Properties.setInt(LAUNCH_COUNTER_KEY, launchesUntilPrompt);
            //this launch
            decrementLauchCounter();
        }
    }

    resume();
};

function resume() {
    if(exports.isOff()) return;
    var timeoutValue = exports.getRemainedTimeout();
    if(timeoutValue && !_timer) {
        _timer = setInterval(tick, timerInterval * 1000);
    }
}

/**
 * Reset reminder to initial state.
 */
exports.reset = function() {
    Ti.App.Properties.setBool(OFF_KEY, false);
    Ti.App.Properties.setBool(CRASHED_KEY, false);
    this.resetCounters();
};

/**
 * Reset counters only to initial state
 */
exports.resetCounters = function() {
    Ti.App.Properties.setInt(USAGE_TIMEOUT_KEY, timeUntilPrompt);
    Ti.App.Properties.setInt(LAUNCH_COUNTER_KEY, launchesUntilPrompt);
};

/**
 * Is user already done rate or rejected it
 * @return {bool} is off
 */
exports.isOff = function() {
    return Ti.App.Properties.getBool(OFF_KEY, false);
};

/**
 * Is app crashed
 * @return {bool} is crashed
 */
exports.isCrashed = function() {
    return Ti.App.Properties.getBool(CRASHED_KEY, false);
};

/**
 * Set mark as rate done and stop timers
 */
exports.switchOff = function() {
    clearTimer();
    clearDialogTimer();
    Ti.App.Properties.setBool(OFF_KEY, true);
};

/**
 * Set mark as rate not done and start timer
 */
exports.switchOn = function() {
    Ti.App.Properties.setBool(OFF_KEY, false);
    resume();
};

/**
 * Goes to application store page
 */
exports.rate = function() {
    // no need more
    this.switchOff();
    // detect android device
    if( Titanium.Platform.osname == 'android' ){
        var intent, url;
        try {
            url = "market://details?id=" + Ti.App.id;
            // To count with Play market backstack, After pressing back button,
            // to taken back to our application, we need to add following flags to intent.
            var flags = Ti.Android.FLAG_ACTIVITY_NO_HISTORY | Ti.Android.FLAG_ACTIVITY_MULTIPLE_TASK |
            (Ti.Platform.Android.API_LEVEL >= 21 ? 524288 //FLAG_ACTIVITY_NEW_DOCUMENT
            :Ti.Android.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET);

            intent = Ti.Android.createIntent({
                action: Ti.Android.ACTION_VIEW,
                data: url,
                //packageName: "com.android.vending",
                //className: "com.google.android.finsky.activities.LaunchUrlHandlerActivity",
                flags: flags
            });
            Ti.Android.currentActivity.startActivity(intent);
        } catch(e) {
            url = "https://play.google.com/store/apps/details?id=" + Ti.App.id;
            Ti.API.debug(TAG, 'Use failback rate url:', url);
            intent = Ti.Android.createIntent({
                action: Ti.Android.ACTION_VIEW,
                data: url
                //packageName: "com.android.vending",
                //className: "com.google.android.finsky.activities.LaunchUrlHandlerActivity"
            });
            try {
                Ti.Android.currentActivity.startActivity(intent);
            } catch(e) {
                url = "market://details?id=" + Ti.App.id;
                Ti.API.debug(TAG, 'Use failback rate url:', url);
                Ti.Platform.openURL(url);
            }
        }
    // detect iphone and ipad devices
    } else {
        if (Ti.Platform.version < 7) {
            Ti.Platform.openURL("itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=" + Ti.App.id);
        } else {
            Ti.Platform.openURL("itms-apps://itunes.apple.com/app/id" + Ti.App.id);
        }
    }
};

/**
 * Get remained launches until prompt
 * @return {number} remained launches
 */
exports.getLaunchesUntilPrompt = function() {
    return Ti.App.Properties.getInt(LAUNCH_COUNTER_KEY, 0);
};

/**
 * Reminder remained time
 * @return {number} remained time in seconds
 */
exports.getRemainedTimeout = function() {
    return Ti.App.Properties.getInt(USAGE_TIMEOUT_KEY, 0);
};

function clearTimer() {
    if(_timer) {
        clearInterval(_timer);
        _timer = null;
    }
}

function clearDialogTimer() {
    if(_dialogTimeout) {
        clearTimeout(_dialogTimeout);
        _dialogTimeout = null;
    }
}

function tick() {
    if(exports.isOff()) return;

    var timeoutValue = exports.getRemainedTimeout();
    if(timeoutValue === 0) return;

    timeoutValue = Math.max(0, timeoutValue - timerInterval);
    Ti.App.Properties.setInt(USAGE_TIMEOUT_KEY, timeoutValue);
    if(timeoutValue === 0) {
        Ti.API.debug(TAG, 'by timer');
        showReminderPrompt();
    }
}

function showReminderPrompt() {
    if(exports.isOff() || (!showIfAppHasCrashed && exports.isCrashed())) return;
    clearDialogTimer();
    clearTimer();
    exports.resetCounters();
    if(promptDelay) {
        _dialogTimeout = setTimeout(function() {
            exports.showRateDialog();
            _dialogTimeout = null;
        }, promptDelay * 1000);
    } else {
        exports.showRateDialog();
    }
}

/**
 * Show rate me dialog
 */
exports.showRateDialog = function() {
    if(_.isFunction(this.onRate)) {
        this.onRate();
        return;
    }

    var dialog = Ti.UI.createAlertDialog({
		title: L('rateme_title', 'Feedback'),
		message: String.format(
            L('rateme_message', 'Thank you for using %s! It would mean a lot for us if you take a minute to rate us at the %s!'),
            Ti.App.name, this.storeName),
		buttonNames: [
            L('rateme_option_ratenow', 'Rate now'),
            L('rateme_option_off', "Don't remind me again"),
            L('rateme_option_later', 'Not now')
        ],
		cancel: 2
	});

	dialog.addEventListener('click', function(evt){
		switch(evt.index) {
			case 0 : // rate
				exports.rate();
				break;
			case 1: // don't remind
                exports.switchOff();
				break;
            case 2: // not now
                exports.switchOn();
                break;
		}
	});
	dialog.show();
};

function decrementLauchCounter() {
    var counter = Ti.App.Properties.getInt(LAUNCH_COUNTER_KEY);
    if(counter) Ti.App.Properties.setInt(LAUNCH_COUNTER_KEY, --counter);

    if(!exports.isOff() && counter === 0) {
        // delay for window open
        Ti.API.debug(TAG, 'by launch counter');
        _.delay(showReminderPrompt, 2000);
    }
}

decrementLauchCounter();
