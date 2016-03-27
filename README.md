# Rate Me library
Feedback reminder for your application

[![License](http://img.shields.io/badge/license-MIT-orange.svg)](http://mit-license.org)
[![GitHub issues](https://img.shields.io/github/issues/falkolab/Ti.RateMe.svg)](https://github.com/falkolab/Ti.RateMe/issues)

## Overview

You want feedback about your app so you know what is working and what is not. You may also want the users to rate your app.

This is feedback reminder for Appcelerator Titanium SDK.


## Installation
### Get it [![gitTio](http://gitt.io/badge.png)](http://gitt.io/component/com.falkolab.rateme)
Download the latest distribution ZIP-file and consult the [Titanium Documentation](http://docs.appcelerator.com/titanium/latest/#!/guide/Using_a_Module) on how install it, or simply use the [gitTio CLI](http://gitt.io/cli):

`$ gittio install com.falkolab.rateme`

## API

With this module you can track launch count and time until prompt user for feedback.

## Methods

* **init** - module initializer
    * `opts`: *Object* - configuraion object.
        * `opts.promptDelay`: `number` - delay before show reminder dialog (seconds).
        * `opts.timeUntilPrompt`: `number` - app run time in seconds before show reminder dialog.
        * `opts.launchesUntilPrompt`: `number` - app launch times before show reminder dialog.
        * `opts.timerInterval`: `number` - internal timer period in seconds.
        * `opts.showIfAppHasCrashed`: `bool` - whether or not to show reminder dialog if app was crashed before.
        * `opts.appId`: `string` - application id. `Ti.App.id` for Android or id from App Store for iOS.
* **reset** - reset reminder to initial state.
* **resetCounters** - reset counters only to initial state.
* **isOff** - is user already done rate or rejected it.
* **switchOff** - set mark as rate done and stop timers.
* **switchOn** - set mark as rate not done and start timer.
* **isCrashed** - is app crashed (`uncaughtException` event used).
* **rate** - goes to application store page.
* **getLaunchesUntilPrompt** - get remained launches until prompt.
* **getRemainedTimeout** - reminder remained time in seconds.
* **showRateDialog** - show rate me dialog.

## Custom dialog

You can define own dialog by set custom function to the `onRate` library property.

Use this library methods for user answers:

* **rate** - `rate()`
* **don't remind** - `switchOff()`
* **not now** - `switchOn()`

## i18n strings

* **rateme_title**
* **rateme_message**
* **rateme_option_ratenow** - Rate now
* **rateme_option_off** - Don't remind me again
* **rateme_option_later** - Not now

## Examples

    var rateme = require('com.falkolab.rateme');
    rateme.init({
        promptDelay: 15, // seconds
        timerInterval: 60, // seconds
        timeUntilPrompt: 7 * 24 * 60 * 60, // 7 days in seconds
        showIfAppHasCrashed: ENV_PRODUCTION ? false : true,
        launchesUntilPrompt: 20
    });

    rateme.onRate = function() {
        Alloy.createController('customRateMeDialog').getView().open();
    };


Go to app store rate page from app menu:

    require('com.falkolab.rateme').rate();

## Changelog

* 1.0.1 - fix for launch counter

## License

MIT

Copyright (c) 2016 Andrey Tkachenko aka falkolab
