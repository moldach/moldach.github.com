---
title: "TensorFlow CNN for Fast Style Transfer"
seoTitle: "TensorFlow CNN for Fast Style Transfer | Matthew Oldach"
description: "A TensorFlow style-transfer experiment inspired by board sports, with original images, animations and implementation notes."
primaryIntent: "Read the original TensorFlow CNN for Fast Style Transfer article"
publishedAt: "2019-04-21"
author: "Matthew Oldach"
topics: ["Software","R"]
sourceUrl: "https://moldach.github.io/post/faststyletransfer/"
---

Volcom was founded in 1991, it was the first company to combine skateboarding, surfing and snowboarding under one brand from it’s incepetion. I always loved how their aesthethics captured the energy and artistry of board-riding in its purest form.

If you have no idea what I’m talking about here’s some samples from print advertisments and a clip from 2003’s [**Big Youth Happening**](https://www.youtube.com/watch?v=VGBQw46BbWA) which I would say was the ultimate inspiration for this post.

![Original illustration from faststyletransfer](/post/faststyletransfer/volcom_huc406feca3dabf7149ea9dc5169e14965_1515696_6e4277669f51e061b91c4747193eeee5.webp)

![Original illustration from faststyletransfer](/post/faststyletransfer/bigYouth.gif)

Non-photorealistic rendering ([NPR](https://books.google.ca/books?id=YjXlTPFYGEYC&redir_esc=y)) is a combination of computer graphics and computer vision that produces renderings in various artistic, expressive or stylized ways. A new art form that couldn’t have existed without computers. Researchers have proposed many algorithms and _styles_ such as painting, pen-and-ink drawing, tile mosaics, stippling, streamline visualization, and tensor field visualization. Although the details vary, the goal is to make an image look like some other image. Two main approaches to designing these algorithms exist. _Greedy algorithms_ greedily place strokes to match the target goas. _Optimization algorithms_ iteratively place and then adjust stroke positions to minimize the objective function. NPR can be done using a number of machine learning methods, most commonly [General Adverserial Networks](https://vimeo.com/302584040) or [Convolution Neural Networks](https://www.youtube.com/watch?v=UFffxcCQMPQ)(CNN) such as painting and drawing.

![Original illustration from faststyletransfer](/post/faststyletransfer/example_hua721ea6717291d1fc23ecedebcf1af99_1097681_f9257feb6ffad45f895b7d7ee59fb531.webp)

I wanted to use [lengstrom/fast-style-transfer](https://github.com/lengstrom/fast-style-transfer), an _optimization technique_, on a video of my friends and I backcountry skiing and snowboarding in The Rocky Mountains of Alberta.

Fast-style-transfer is a TensorFlow CNN model based on a combination of [Gatys’ A Neural Algorithm of Artistic Style](https://arxiv.org/abs/1508.06576), Johnson’s [Perceptual Losses for Real-Time Style Transfer and Super-Resolution](http://cs.stanford.edu/people/jcjohns/eccv16/), and Ulyanov’s [Instance Normalization](https://arxiv.org/abs/1607.08022). I’ll skip the details here because it’s been been far better described in the publications above (or in layman’s terms [here](https://towardsdatascience.com/a-journey-into-convolutional-neural-network-visualization-1abc71605209), [here](https://medium.com/tensorflow/neural-style-transfer-creating-art-with-deep-learning-using-tf-keras-and-eager-execution-7d541ac31398), and [here](https://towardsdatascience.com/intuitively-understanding-convolutions-for-deep-learning-1f6f42faee1)), suffice it to say it allows you to compose images/videos in the style of another image. Besides being fun it’s a nice visual way of showing the capabilities and internal representations of neural networks.

`fast-style-transfer` repo comes with 6 trained models on famous paintings, allowing you to quikcly style your images (or videos) like them. But what’s the fun in doing what others have alread done?

I wanted to see what kind of effect would be produced by training style transfer networks around interesting shapes and patterns! I selected a number patterns I thought would be interesting, for example animal patterns, fractals, fibonnaci sequences, a few vaporwave images ([of course](https://github.com/moldach/vapoRwave)), and a bunch of images taken under a [SEM microscope](https://en.wikipedia.org/wiki/Scanning_electron_microscope).

![Original illustration from faststyletransfer](/post/faststyletransfer/collage_hu571b88c0b4b1510f09fe04bf98e8e804_9263891_36d95f5b2e8c28f7262a281bd669e9e3.webp)

I then constructed a script to train 50 models simultaneously on a HPC (using a [GPU NVIDIA V100 Volta](https://images.nvidia.com/content/technologies/volta/pdf/tesla-volta-v100-datasheet-letter-fnl-web.pdf); a top-of-the-line $10,000 GPU - _spared no expense_). After _many many_ hours of training, across hundreds of cores, I selected the 20 best (_i.e._ most aesthetically pleasing) models to apply to the video.

![Original illustration from faststyletransfer](/post/faststyletransfer/mountains.gif)

(**The entire high-quality video can be found here**\]([https://youtu.be/TuN4456PK-c)](https://youtu.be/TuN4456PK-c%29).

#### Technical Notes:

When training the models I noticed that the checkpoint files were being corrupted. I found a [closed issue on the repo: #78](https://github.com/lengstrom/fast-style-transfer/issues/78#issuecomment-302307215) stating that Tensorflow’s Saver class was updated so you’ll need to change line 136 in `/src/optimize.py`.

The script for training all of the networks on an HPC with a SLURM job scheduler is below, and can be run with `bash fastTrainer.bash <image_path> <out_path> <test_path>`. Simply clone [lengstrom/fast-style-transfer](https://github.com/lengstrom/fast-style-transfer) and create three folders inside. Create a sub-directory where you’ll put all the **style images** you want to train, another sub-directory for the **output** (`.ckpt` files used to style your `.mp4` videos), and a **test** sub-directory for the model. As a default I used the `chicago` for training and I’m not entirely sure if that makes a difference.

```bash
!/bin/bash
#$ -pwd

# bash fastTrainer.bash /images/ /outpath/ /testpath/
##
## An embarrassingly parallel script to train many style transfer networks on a HPC
## Access to SLURM job scheduler and fast-style-transfer is required to run this program.
## The three mandatory pathways must be specified in the indicated order.

IMG=$(readlink -f "${1%/}")     # path_to_train_images
OUT_DIR=$(readlink -f "${2%/}")  # path_to_checkpoints
TEST=$(readlink -f "${3%/}")  # path_to_tests

mkdir -p ${OUT_DIR}/jobs

JID=0   # job ID for SLURM job name

for f in ${IMG}/*; do

        let JID=(JID+1)

  cat > ${OUT_DIR}/jobs/style_${JID}.bash << EOT # write job information for each job
#!/bin/bash
#SBATCH --gres=gpu:1        # request GPU
#SBATCH --cpus-per-task=2   # maximum CPU cores per GPU request
#SBATCH --time=00:01:00     # request 8 hours of walltime
#SBATCH --job-name="fst_${JID}"
#SBATCH --output=${OUT_DIR}/jobs/%N-%j.out  # %N for node name, %j for jobID

### JOB SCRIPT BELLOW ###

# Load Modules
module load python/2.7.14
module load scipy-stack
source tensorflow/bin/activate

mkdir ${OUT_DIR}/${JID}
mkdir ${TEST}/${JID}

python style.py --style $f \
  --checkpoint-dir ${OUT_DIR}/${JID} \
  --test examples/content/chicago.jpg \
  --test-dir ${OUT_DIR}/${JID} \
  --content-weight 1.5e1 \
  --checkpoint-iterations 1000 \
  --batch-size 20

EOT
  chmod 754 $(readlink -f "${OUT_DIR}")/jobs/style_${JID}.bash
  sbatch $(readlink -f "${OUT_DIR}")/jobs/style_${JID}.bash
done
```

### What I learned

Now [Sean Dorrance Kelly](https://www.technologyreview.com/s/612913/a-philosopher-argues-that-an-ai-can-never-be-an-artist/) might argue I’m using the machines “creativity” as a subsititute for my own but I would disagree since there was a fair amount of creativity in selecting images to train models on and the editing itself. That being said an [AI generated work of art recently sold for $432,500 at Christie’s](https://www.christies.com/features/A-collaboration-between-two-artists-one-human-one-a-machine-9332-1.aspx) (the first auction house to offer a piece of art created by an algorithm).

Besides the opportunity to exercise my right-brain, it was a good chance to gain some experience with tensorflow and python. This project was also illuminating because it made the hidden layers of networks more comprehensible by literally allowing me to _see_ how neural networks are performing!

I think the field of **Feature visualization** is exciting because it allows to peer behind the curtain and see how networks learn to classify images accurately. Take for example the [Activation atlas](https://distill.pub/2019/activation-atlas/?utm_campaign=Data_Elixir&utm_medium=email&utm_source=Data_Elixir_224) which reveals visual abstractions within a model. It gives a global view of a dataset by showing feature visualization of averaged activation values from a neural network.

![Original illustration from faststyletransfer](/post/faststyletransfer/atlas_hu441115eb4fc19f5f40e916fee9f80cb9_1868296_bb6c2b7c8e30a5775ac2f97426e5e33b.webp)

> As an analogy, while the 26 letters in the alphabet provide a basis for English, seeing how letters are commonly combined to make words gives far more insight into the concepts that can be expressed than the letters alone. Similarly, activation atlases give us a bigger picture view by showing common combinations of neurons.

In a perfect world the artist/user should have control over the decisions made by the algorithm. For example, to specify spatially varying styles to use, so that different rendering styles are used in different parts of the image, or to specify positions of individuial strokes. However, training these models is still too slow to be useful in an interactive application.
