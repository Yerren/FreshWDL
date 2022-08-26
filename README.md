# FreshWDL

FreshWDL is a lightweight, pure JavaScript alternative to WDL (which runs on Flash).
This allows for users to access it from nearly any device and platform.

Currently it is still simple, offering little customisability, but with interest and support will be able to go a long way!

See it in action at: http://www.goldenbaynzweather.info/wdl/freshwdl.html


## Setup

1. Go to: http://www.weather-display.com/files.php, and download the FreshWDL files.
2. (If needed) Adjust the config.js file in any text editor, changing the 'clientraw' file names to match the names you use. You can also change the default units here. If you need, it is also possible to set the path to where your 'clientraw' files are uploaded (see part 4).
3. (Optional) You can rename the html page to anything you wish. 
4. Upload both the html page and the config.js file to the same location on your server. If you set a custom path to your clientraw files in config.js, you can upload them anywhere. Otherwise, they must be in the same place your clientraw files are uploaded to.

You should now be good to go! Simply navigate to the html page in any web browser to see your new FreshWDL page up and running!

## Language
- **To set the language:** set the **lang** field in your config file to one of: en (English), nl (Dutch), da (Danish), ro (Romanian), fr (French), gr (Greek), it (Italian), es (Spanish), nb (Norwegian), bg (Bulgarian), cs (Czech), fi (Finnish), si (Slovenian), de (German), pt (Portuguese), sv (Swedish), ca (Catalan), or hr (Croatian).
- If you want to help translate the system into your language, please don't hesitate to get in touch. (It takes less than an hour to fully translate into a new language!)
- A great thanks goes out to those who have helped so far!

## Troubleshooting
#### (24 Hour) Graphs having strange straight line portions for 12 hours spans:
- Caused by the clientraw files uploading in 12 hour format. Download the newest version of WD to fix this issue.

#### "Data Currently Unavailable" showing on loading screen:
- This can happen briefly if there is a 'hiccup' on the server, and should normally go away quickly.
- If you have just set up your FreshWDL page, and the "Data Currently Unavailable" message persists, it is most likely because either the names of the clientraw files or the custom path to the clientraw files in config.js are not correct or, if no custom path was set, the html page and config.js have not been uploaded to where the clientraw files are uploaded to.

## Getting In Touch
If you want to suggest a feature or report a bug, either go to the "Issues" tab and enter the details in there, or email me at yerren@renerica.com. Any feedback is welcome.

## Donate
If this project has helped you out, or if you simply want to support its continued development, please consider donating :)
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YUWBQ597CU24U)
