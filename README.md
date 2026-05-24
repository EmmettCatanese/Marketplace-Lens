# Marketplace-Lens
Browser extension for FB Marketplace that overlays vehicle values onto listings

## About this project

Shopping for a vehicle on Facebook Marketplace can be hard because there's an abundance of options. My goal of this project was to help you whittle down the options and get a better understanding of what’s plainly a bad deal and what might be worth buying. 

This extension builds on my script that scrapes data from a prominent car value estimator.

## How does it work?

There are three things that this plugin does. The first thing is we look for the cards. The way I opted to do this was to simply identify containers that link to `/marketplace/item/...`. We then take out the listing name and price from this container. Second, we need to figure out how to read listing names. The way this algorithm works is it takes listing names and starts by taking the model year, which is the easiest to identify. Then, we remove the manufacturer name. From what is left, we try to match a model name in there. After that is removed, whatever is left should hopefully be our trim. 

Once we have these parameters we can look for the correct vehicle in the dataset. Then, the third part of the extension injects the badge in the top right of the card showing the private party evaluation. It will also show trade in and fair purchase price. Then, below we make a box that shows how the price compares to the private party price. 

If we fail to match a trim, instead of showing this comparison it just shows a range of numbers for what the private party could be from the lowest trim to the highest trim. 

## How do you use it?

Download the extension folder from this repository! Go to manage extensions in your browser. In the top right, click developer mode. Then load unpacked. 

This will load the extension with the default data which is up to date as of May 2026 and adjusted for the NYC metro area. If you would like to learn more about the data, [check my repo](https://github.com/EmmettCatanese/Car-Value-Scraper) for how I scraped it! If you would like, you can also load your own data. 

To load your own data, download build_data.py and put it in the same directory as the extension folder as well as the data you want to import. Make sure lines 4 and 5 of build_data are pointing to the right files and then run it. This will flatten your json into a single line that we are able to store in a js file because extensions cant access normal files!
