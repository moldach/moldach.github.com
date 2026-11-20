---
title: How to Highlight 3D Brain Regions
seoTitle: How to Highlight 3D Brain Regions | Matthew Oldach
description: Three approaches to highlighting brain regions with BrainNet Viewer, Mango and R, including the original screenshots and code.
primaryIntent: Learn the original brain-region visualisation workflow
publishedAt: "2018-10-31"
topics: [Visualisation, R, MATLAB]
sourceUrl: https://medium.com/data-science/how-to-highlight-3d-brain-regions-2e6c15a35574
featuredOrder: 2
---

> Archive restoration: originally published on October 31, 2018. Recovered from Matthew’s Medium author feed with all 26 article images and original code. These are historical instructions; the software and package versions have not been revalidated. Figure credits and John Muschelli’s code contribution are preserved below.

Recently, I was reading Howard _et. al.,_ (2018) “**Genome-wide meta-analysis of depression in 807,553 individuals identifies 102 independent variants with replication in a further 1,507,153 individuals**” and saw a really cool 3D visualization of highlighted brain regions associated with depression:

![Introduction: original article illustration 1](../../assets/recovered/brain/brain-01.webp)

*Source: [https://goo.gl/7rY5KV](https://goo.gl/7rY5KV)*

After an exhaustive search I couldn’t find any reference to how this was done in the methods or supplementary information so I reached out to the authors. While I was awaiting a response, I also reached out to the [Twitterverse](https://twitter.com/MattOldach/status/1051909841529315328) to see if anyone knew of tools which could be used to create such a visualization.

[Helmet Karim](https://twitter.com/KarimH349) suggested that perhaps these images were created using BrainNet Viewer in MATLABso this was the first method I tried out.

_Note_: All of the methods covered in this article use what is called a brain Atlas overlayed as a maskon a normalized T1 MRI image. I’ve chosen to highlight the left hippocampus across these methods so that they are comparable.

### BrainNet Viewer

![BrainNet Viewer: original article illustration 2](../../assets/recovered/brain/brain-02.webp)

First follow the install instructions for BrainNet Viewer [here](https://www.nitrc.org/docman/view.php/504/1280/BrainNet) then start the graphical user interface (GUI) up from the terminal.

![BrainNet Viewer: original article illustration 3](../../assets/recovered/brain/brain-03.webp)

Next select load file and choose a surface template surface template and a mapping file (_i.e._ a brain atlas). The package provides samples so I chose BrainMesh\_ICBMI52\_smoothed.nv and the \[[AAL90](http://neuro.imm.dtu.dk/wiki/Automated_Anatomical_Labeling)\]([http://neuro.imm.dtu.dk/wiki/Automated\_Anatomical\_Labeling](http://neuro.imm.dtu.dk/wiki/Automated_Anatomical_Labeling)) brain atlas which has labeled volumes for 90 brain regions.

![BrainNet Viewer: original article illustration 4](../../assets/recovered/brain/brain-04.webp)

![BrainNet Viewer: original article illustration 5](../../assets/recovered/brain/brain-05.webp)

![BrainNet Viewer: original article illustration 6](../../assets/recovered/brain/brain-06.webp)

Next there’s a pop-up with 7-sections of which layout, surface and volume are of interest to us.

In layout select which view you would like, I’ve chosen full view which will show eight different viewpoints.

![BrainNet Viewer: original article illustration 7](../../assets/recovered/brain/brain-07.webp)

In the surface tab you can select the transparency of the surface map — I’ve set it to **0.75**.

![BrainNet Viewer: original article illustration 8](../../assets/recovered/brain/brain-08.webp)

In the volume tab select ROI drawing, deselect draw all and in the custom box put **37** (the code for hippocampus\_L). Then select **Ok**.

![BrainNet Viewer: original article illustration 9](../../assets/recovered/brain/brain-09.webp)

![BrainNet Viewer: original article illustration 10](../../assets/recovered/brain/brain-10.webp)

### Mango

I am currently in discussion with the Howard laboratory trying to get the exact methodology they used to create the image in their figure, but this how I believe they did it with \[[Mango](http://ric.uthscsa.edu/mango/download.html)\].

Mango has good [video tutorials](http://ric.uthscsa.edu/mango/videos.html), [user guide](http://rii.uthscsa.edu/mango/userguide.html) and [forum](http://rii.uthscsa.edu/mango/forum/) but for those of us whose sole interest is creating a highlighted 3D brain image it’s a lot of material to go through. Therefore, I decided to create a detailed protocol of this process to save others time.

I decided to download the [Hammers brain atlas](https://figshare.com/articles/Hammers_mith-n30r95_parietal_lobe_MRI_atlas_database/5024939) to use as the mask/overlay and the sample image provided with Mango

![Mango: original article illustration 11](../../assets/recovered/brain/brain-11.webp)

Next select Add Overlay and choose the hippocampus\_L.

![Mango: original article illustration 12](../../assets/recovered/brain/brain-12.webp)

![Mango: original article illustration 13](../../assets/recovered/brain/brain-13.webp)

Now select Image > Build Surface to create a 3D representation of the brain.

![Mango: original article illustration 14](../../assets/recovered/brain/brain-14.webp)

In this new pop-up GUI there’s a few things we want to do. First, change the background to white so this can be published in a manuscript. Second, change the transparency of this image to **0.75**.

![Mango: original article illustration 15](../../assets/recovered/brain/brain-15.webp)

![Mango: original article illustration 16](../../assets/recovered/brain/brain-16.webp)

![Mango: original article illustration 17](../../assets/recovered/brain/brain-17.webp)

![Mango: original article illustration 18](../../assets/recovered/brain/brain-18.webp)

Under the View tab deselect the Crosshairs.

![Mango: original article illustration 19](../../assets/recovered/brain/brain-19.webp)

In the other panel select Analysis > Create Logical Overlays then in the surface panel select Shapes > Add Logical.

![Mango: original article illustration 20](../../assets/recovered/brain/brain-20.webp)

![Mango: original article illustration 21](../../assets/recovered/brain/brain-21.webp)

Then under Surface > Views you can select any orientation you like then Surface > Create Snapshot to save as a .png.

![Mango: original article illustration 22](../../assets/recovered/brain/brain-22.webp)

Here are three views of the hippocampus\_L: **anterior**, **left** and **superior**:

![Mango: original article illustration 23](../../assets/recovered/brain/brain-23.webp)

![Mango: original article illustration 24](../../assets/recovered/brain/brain-24.webp)

![Mango: original article illustration 25](../../assets/recovered/brain/brain-25.webp)

### R Implementation

[John Muschelli](http://johnmuschelli.com/), an Assistant Scientist at Johns Hopkins Bloomberg School of Public Health who has authored numerous R packages (_e.g._ fslr) responded a couple weeks later to my tweet. He whipped up a gist to highlight a 3D brain image in R.

```r
library(rgl)
library(misc3d)
library(neurobase)
if (!requireNamespace("aal")) {
  devtools::install_github("muschellij2/aal")
} else {
  library(aal)
}
if (!requireNamespace("MNITemplate")) {
  devtools::install_github("jfortin1/MNITemplate")
} else {
  library(MNITemplate)
}
```

```r
img = aal_image()
template = readMNI(res = "2mm")
cut <- 4500
dtemp <- dim(template)
```

```r
# All of the sections you can label
labs = aal_get_labels()
```

```r
# Pick the region of the brain you would like to highlight - in this case the hippocamus_L
hippocampus = labs$index[grep("Hippocampus_L", labs$name)]
```

```r
mask = remake_img(vec = img %in% hippocampus, img = img)
```

```r
### this would be the ``activation'' or surface you want to render
contour3d(template, x=1:dtemp[1], y=1:dtemp[2], z=1:dtemp[3], level = cut, alpha = 0.1, draw = TRUE)
contour3d(mask, level = c(0.5), alpha = c(0.5), add = TRUE, color=c("red") )
### add text
text3d(x=dtemp[1]/2, y=dtemp[2]/2, z = dtemp[3]*0.98, text="Top")
text3d(x=-0.98, y=dtemp[2]/2, z = dtemp[3]/2, text="Right")
rglwidget()
```

![R Implementation: original article illustration 26](../../assets/recovered/brain/brain-26.webp)

John Muschelli also teaches a couple of short courses on imaging in R and I’m currently taking his \[[Neurohacking](https://www.coursera.org/learn/neurohacking)\] course. I really appreciate him taking the time to do this.

If your interested in learning more about medical imaging in R be sure to check out [Neuroconductor](https://www.ncbi.nlm.nih.gov/pubmed/29325029)

If you find this article useful feel free to share it with others or recommend this article! 😃

As always, if you have any questions or comments feel free to leave your feedback below or you can always reach me on [LinkedIn](https://www.linkedin.com/in/matthewoldach/). Till then, see you in the next post! 😄
