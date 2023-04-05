<p align="center">
  <a href="https://www.gatsbyjs.com">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  Plugin for creating MDX from remote content
</h1>

This is a minimal transformation plugin that takes sourced nodes and builds MDX File nodes out of them, with configurable node locations for the mdx field to use, and where to source the frontmatter.

Multiple source nodes are supported.

## 🚀 Quick start, step 1: prerequisites

To get started with this plugin, you need to have a working MDX support. To support querying for frontmatter and body, at least one local MDX file must exist.

1. Configure MDX according to the [MDX documentation](https://www.gatsbyjs.com/docs/how-to/routing/mdx/)
   1. Get a first MDX file working, sourced from the filesystem, and example at `./src/pages/mypage.mdx`.
   2. Once you have a working MDX configuration and you can see your `mypage.mdx` rendered properly (converted to html), you can add support for programmatic creation of MDX File nodes below (such as sourced from a remote location)
2. Install this plugin and prerequisites
3. Configure the nodes to pick up and their fields
4. Restart gatsby and if necessary, make a `gatsby clean`

## 2. Install plugin and prerequisites

```shell
npm install gatsby-transform-remote-mdx @mdx-js/react
```

## 3. Configure the plugins in gatsby-config.js

```javascript
module.exports = {
  plugins: [
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    {
      resolve: `gatsby-transform-remote-mdx`,
      options: {
        mdxNodeTypes: {
          "MyNodeType": {
            // If a hierarchy of objects is to be traversed, use a dot (.) for each level
            mdxField: "statement.markdown",
            mdxFrontmatterField: "frontmatter",
          }
        },
      }
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        gatsbyRemarkPlugins: [
          {
            // The regular gatsby-remark-images does not support remote images.
            // A different plugin may be required
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1200,
            },
          },
        ],
      },
    },
  ],
}
```

# 4. Start gatsby

```shell
gatsby develop
```
