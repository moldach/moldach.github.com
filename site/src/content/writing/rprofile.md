---
title: "Step aside Cron, this is a job for .Rprofile & logfiles!"
seoTitle: "Step aside Cron, this is a job for .Rprofile & logfiles! | Matthew Oldach"
description: "An R workflow for automating routine tasks with .Rprofile and log files, including scheduling context and original examples."
primaryIntent: "Read the original Step aside Cron, this is a job for .Rprofile & logfiles! article"
publishedAt: "2019-04-02"
author: "Matthew Oldach"
topics: ["Software","R"]
sourceUrl: "https://moldach.github.io/post/rprofile/"
---

Just as [test automation](https://github.com/r-lib/testthat) is a critical part of [rutheless testing](http://users.atw.hu/sustainsoftdev/ch05lev1sec2.html), your goal for any project should be to identify taks that can be automated (and do it!).

There are a number of packages that allow you to schedule R scripts at specific times; two that come to mind are [`taskscheduleR`](https://cran.r-project.org/package=taskscheduleR) (for Windows) and [`cronR`](https://cran.r-project.org/package=cronR) (for Unix/Linux). We have `cronR` setup on RStudio server at work, and it has a nice _RStudio addin_ which allows us to schedule tasks around any complex schedule. You can use these kind of tools [to automate data collections](http://www.r-datacollection.com/blog/Welcome-to-the-ADCR-Blog/), [automate markdown reports to e-mail](http://www.r-datacollection.com/blog/Welcome-to-the-ADCR-Blog/), [or even the weather](http://www.r-datacollection.com/blog/Welcome-to-the-ADCR-Blog/).

Alternatively, when you want a function (or script) to launch every time you start `R` you can place these inside `.Rprofile`.

But what about if you want a function to start only the first time a user logs in? This could be something simple (like a reminder) to fill in a progress report, or in this case a bit of _Monday Morning (de)Motivation_. This is a job for logfiles!

Let’s be straight here, I love Mondays (because [rweekly](https://rweekly.org/) is released!), but most people don’t! Therefore, I made a `.csv` file of `178` quotes about Monday and a folder of 83 `.png` images of cartoon characters sleeping. I used the `.First()` function in `.Rprofile` to create a logfile (if one doesn’t already exist) and randomly pair an image with a quote the first time a user logs in on Monday morning (using the `advicegiveR` package). Here’s some examples of images a user might see first thing Monday morning:

#### The Good

![Original illustration from rprofile](/post/rprofile/fig1_hu5a1589c8bcd3d7f5f30c6091766e3247_1373430_385320775d847f880569227d6153ff94.webp)

#### The Bad

![Original illustration from rprofile](/post/rprofile/fig2_hu01f61ae31562a786a18e1b7d86b7653d_855474_81788cd0aa56d2f32dedf725c51bdcae.webp)

#### The Ugly

![Original illustration from rprofile](/post/rprofile/fig3_hua8c193949325defd6149d4a918e90300_984012_6517342bb321630fa1ef94196114f57f.webp)

Any other time of that day (or any other day of the week) it will simply call a sage piece of collected advice from the `R-help` forum via the `fortunes` package. An example:

> R will always be arcane to those who do not make a serious effort to learn it. It is **not** meant to be intuitive and easy for casual users to just plunge into. It is far too complex and powerful for that. But the rewards are great for serious data analysts who put in the effort. – Berton Gunter R-help (August 2007)

You need to create a folder in your home directory that contains a `quotes.csv`, a `LogFile.txt` and `images` folder.

```r
.First <- function(){
        today <- as.Date(Sys.Date())
        LastLog <- ""
        if(file.exists("~/iHateMondays/LogFile.txt")) {
                LogFile <- file("~/iHateMondays/LogFile.txt", open="r")
                LastLog <- readLines(LogFile, 1L)
                close(LogFile)
        }
        LogFile <- file("~/iHateMondays/LogFile.txt", open="w")
        writeLines(as.character(today), LogFile)
        close(LogFile)

        if(LastLog == as.character(today)) {
                # Already logged on today, just exit
                return()
        }

        ## If you get here, Need to run the first login code
        DOW <- weekdays(today)
        if (DOW == "Monday") {
                # I Hate Mondays!
                suppressWarnings(library(advicegiveR, warn.conflicts = FALSE))
                suppressWarnings(library(readr, warn.conflicts = FALSE))
                quotes <- read_csv("~/iHateMondays/quotes.csv", col_names = FALSE)
                x1 <- sample(1:nrow(quotes), 1)
                advice <- as.character(quotes[x1,])
                y <- list.files("~/iHateMondays/images")
                # select one randomly
                y1 <- sample(1:length(y), 1)
                image <- magick::image_read(paste0("~/iHateMondays/images", y[y1]))
                # print image
                advicegiveR::print_advice(image = image, advice = advice, textcolor = "yellow", size = 40)
        } else {
                # Fortune
                suppressWarnings(library(fortunes, warn.conflicts = FALSE))
                rnum <- sample(1:386, 1)
                print(fortune(rnum))
        }
}
```

Now Ideally, you should use a contrasting border around the inner text color to make it readable on any background.

![Original illustration from rprofile](/post/rprofile/fig4_hueaced9decf2d3781e68a921bc4e70968_10349_c6533c3ec83c8d9565518849337153e6.webp)

The [`meme` R package](https://github.com/leeper/meme) package uses a black border around text and positions text like a typical meme (top & bottom).

By including a simple helper function to split the quote into equal lengthed top/bottom sections, the code would look like this:

```r
suppressWarnings(library(tidyverse))
word_split <- function(x, side="left", sep=" ") {
  words <- strsplit(as.character(x), sep)
  nwords <- lengths(words)
  if(side=="left") {
    start <- 1
    end <- ceiling(nwords/2)
  } else if (side=="right") {
    start <- ceiling((nwords+2)/2)
    end <- nwords
  }
  cw <- function(words, start, stop) paste(words[start:stop], collapse=sep)
  pmap_chr(list(words, start, end), cw)
}
left_words <- function(..., side) word_split(..., side="left")
right_words <- function(..., side) word_split(..., side="right")

.First <- function(){
        today <- as.Date(Sys.Date())
        LastLog <- ""
        if(file.exists("~/iHateMondays/LogFile.txt")) {
                LogFile <- file("~/iHateMondays/LogFile.txt", open="r")
                LastLog <- readLines(LogFile, 1L)
                close(LogFile)
        }
        LogFile <- file("~/iHateMondays/LogFile.txt", open="w")
        writeLines(as.character(today), LogFile)
        close(LogFile)

        if(LastLog == as.character(today)) {
                # Already logged on today, just exit
                return()
        }

        ## If you get here, Need to run the first login code
        DOW <- weekdays(today)
        if (DOW == "Monday") {
                # I Hate Mondays!
                suppressWarnings(library(readr, warn.conflicts = FALSE))
                suppressWarnings(library(meme, warn.conflicts = FALSE))
                quotes <- read_csv("~/iHateMondays/quotes.csv", col_names = FALSE)
                x1 <- sample(1:nrow(quotes), 1)
                advice <- as.character(quotes[x1,])
                top_words <- left_words(advice)
                bottom_words <- right_words(advice)
                y <- list.files("~/iHateMondays/images")
                # select one randomly
                y1 <- sample(1:length(y), 1)
                image <- magick::image_read(paste0("~/iHateMondays/images/", y[y1]))
                # print image
                meme(paste0("~/iHateMondays/images/", y[y1]), size = "1.5", upper = top_words, lower = bottom_words, color = "yellow", font = "Times")

        } else {
                # Fortune
                suppressWarnings(library(fortunes, warn.conflicts = FALSE))
                rnum <- sample(1:386, 1)
                print(fortune(rnum))
        }
}
```

![Original illustration from rprofile](/post/rprofile/fig5_hu489300b083107adf7f4cbfd451d75d66_3113622_6b6c9114722b580a37361ee4922e3f20.webp)
