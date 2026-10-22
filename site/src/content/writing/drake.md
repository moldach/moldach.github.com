---
title: "Getting Started with Drake in R"
seoTitle: "Getting Started with Drake in R | Matthew Oldach"
description: "An introduction to reproducible data workflows with drake in R, with links to the original talk and presentation."
primaryIntent: "Read the original Getting Started with Drake in R article"
publishedAt: "2019-02-05"
author: "Matthew Oldach"
topics: ["Software","R"]
sourceUrl: "https://moldach.github.io/post/drake/"
---

Recently I got interested in using the `xaringan` package for creating HTML based R Markdown documents because I could use the `widgetframe` package to embed `htmlwidgets` as responsive iframes (I had created some spinning 3D visulizations with pseudo-coloring I wanted to present interactively).

`xaringan`, it’s a `R` pacakges for creating slideshows with [`remark.js`](http://remarkjs.com/) through R Markdown.

Around the same time I learnt about [`Drake`](https://github.com/ropensci/drake) (or “Data Frames in R for Make”) which is an amazing a time-saving reproducible build system for data scientist specifically tailored to `R`. The pacakge makes use of the `futures` package allowing the use of parallel computing on high-performance computing systems.

I recently gave a talk at the Douglas Mental Health University Institute talking about the advantages of Drake (and a few other interesting projects).

![Original illustration from drake](https://media.giphy.com/media/3fhu1Pm9kYB5RgDtn7/giphy.gif)

The slides can be found [here](https://moldach.github.io/xaringan-presentation_drake/)
