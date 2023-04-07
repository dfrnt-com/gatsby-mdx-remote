# Technical notes taken during development

## Conversion from Javascript to Typescript

Many thanks to Greg Perlman for contributing excellent documentation on how to convert a plugin from Javascript to Typescript. Easy to follow and enables the use of modern Typescript features.

* [Creating a Gatsby Plugin With Typescript](https://gregperlman.dev/creating-a-gatsby-plugin-with-typescript/)

## Some instructions for using rehype for proper pre-processing of MDX

The readme provided for [Remark Rehype on Github](https://github.com/remarkjs/remark-rehype) should help convert from plain remark to full-blown MDX support. Preprocessing is required to get proper sharp image nodes from embedded images.

* [Example: supporting HTML in markdown properly](https://github.com/remarkjs/remark-rehype#example-supporting-html-in-markdown-properly)