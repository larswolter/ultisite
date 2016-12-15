// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
    id: 'de.larswolter.ultisite.hallunken',
    name: 'Hallunken App',
    description: 'Easy browsing of Hallunken.de',
    author: 'Lars Wolter',
    email: 'lars@larswolter.de',
    website: 'http://www.larswolter.de'
});

// Set up resources such as icons and launch screens.
App.icons({
    'android_mdpi': 'private/app-content/dynamicAppIcon_48.png',
    'android_hdpi': 'private/app-content/dynamicAppIcon_72.png',
    'android_xhdpi': 'private/app-content/dynamicAppIcon_96.png',
    'android_xxhdpi': 'private/app-content/dynamicAppIcon_144.png',
    'android_xxxhdpi': 'private/app-content/dynamicAppIcon_192.png',
    'iphone_2x': 'private/app-content/dynamicAppIcon_120.png',
    'iphone_3x': 'private/app-content/dynamicAppIcon_180.png'
});

App.accessRule("blob:*");
App.accessRule("https:*.openstreetmap.org",{type:'network'});

App.launchScreens({
    'android_mdpi_portrait': 'private/app-content/splashScreen_480.9.png',
    'android_mdpi_landscape': 'private/app-content/splashScreen_480.9.png',
    'android_hdpi_portrait': 'private/app-content/splashScreen_480.9.png',
    'android_hdpi_landscape': 'private/app-content/splashScreen_480.9.png',
    'android_xhdpi_portrait': 'private/app-content/splashScreen_480.9.png',
    'android_xhdpi_landscape': 'private/app-content/splashScreen_480.9.png',
    'android_xxhdpi_portrait': 'private/app-content/splashScreen_480.9.png',
    'android_xxhdpi_landscape': 'private/app-content/splashScreen_480.9.png',
    'android_xxxhdpi_portrait': 'private/app-content/splashScreen_480.9.png',
    'android_xxxhdpi_landscape': 'private/app-content/splashScreen_480.9.png'
});

// Set PhoneGap/Cordova preferences
App.setPreference('BackgroundColor', '0xff000000');
App.setPreference('HideKeyboardFormAccessoryBar', true);