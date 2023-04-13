<p align="center">
  <a href="https://www.gatsbyjs.com">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  Plugin for creating MDX from remote content
</h1>

## Description

This is a minimal transformation plugin that takes sourced nodes and builds MDX File nodes out of them, with configurable node locations for the mdx field to use, and where to source the frontmatter.

Multiple source node type are supported with individual configurations. Each source node type can be configured independently to preprocess images with sharp, which is the default behaviour.

This plugin extends the functionality of `gatsby-plugin-mdx` by creating mdx nodes from other nodes programatically.

Developed to be used for building MDX-based static websites out of TerminusDB data products hosted at [DFRNT.com](https://dfrnt.com?utm_source=gatsby), accessed via GraphQL. But it should be applicable for most remote MDX/Markdown with images and any GraphQL capable [TerminusDB](https://terminusdb.com) open source or hosted instance.

The frontmatter is expected to be part of the sourced node, and not the MDX contents. PRs and issues are welcome to add additional capabilities to the plugin!

### Dependencies

For this plugin to work, the following dependencies are recommended:

* gatsby-source-filesystem
* gatsby-plugin-mdx
* use at least one .mdx file from the local filesystem (to populate the GraphQL types properly)

If preprocessing images (the default behaviour):

* gatsby-plugin-image
* gatsby-plugin-sharp
* gatsby-transformer-sharp

### Learning Resources

Review the [MDX documentation](https://www.gatsbyjs.com/docs/how-to/routing/mdx/) first, and make local MDX files work before starting to work with remote nodes.

In essence, this is how remote MDX processing works:

1. In the sourceNodes API or through a plugin that does this step automatically, Gatsby content nodes are created. They will contain data as objects in the Gatsby Node structure.
2. MDX nodes are usually created from files, using the `gatsby-source-filesystem` plugin. When creating nodes from remote content, MDX File nodes needs to be created programmatically.
3. This plugin picks up specific node types through the `onCreateNode` API and extracts a frontmatter object to be converted into yaml frontmatter, and also extracts an mdx string from selected node types.
4. Once an `mdx` string with yaml `frontmatter` have been concatenated together, it is written as a File node with the .mdx extension into the Gatsby cache
5. The `gatsby-plugin-mdx` plugin picks up the MDX File object as usual and transforms it into an Mdx node that can be rendered as any other MDX content. 

## How to install

### 🚀 Quick start, step 1: prerequisites

To get started with this plugin, you need to have a working MDX support. To support querying for frontmatter and body, at least one local MDX file must exist.

1. Configure MDX according to the [MDX documentation](https://www.gatsbyjs.com/docs/how-to/routing/mdx/)
   1. Get a first MDX file working, sourced from the filesystem, and example at `./src/pages/mypage.mdx`.
   2. Once you have a working MDX configuration and you can see your `mypage.mdx` rendered properly (converted to html), you can add support for programmatic creation of MDX File nodes below (such as sourced from a remote location)
2. Install this plugin and prerequisites
3. Configure the nodes to pick up and their fields
4. Restart gatsby and if necessary, make a `gatsby clean`

### 2. Install plugin and prerequisites

```shell
npm install @dfrnt/gatsby-mdx-remote @mdx-js/react
```

### 3. Configure the plugins in gatsby-config.js

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
      resolve: `@dfrnt/gatsby-mdx-remote`,
      options: {
        mdxNodeTypes: {
          "MyNodeType": {
            // If a hierarchy of objects is to be traversed, use a dot (.) for each level
            mdxField: "statement.markdown",
            mdxFrontmatterField: "frontmatter",
            preprocessImages: true,
            gatsbyImageClassName: "rounded-md",
          }
        },
        frontmatterSharpRemoteImageUrlArrayField: "imageList",
      }
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
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

### 4. Start gatsby

```shell
gatsby develop
```

## Options

The plugin supports options to ignore files and to pass options to the [`slugify`](https://github.com/sindresorhus/slugify) instance that is used in the File System Route API to create slugs.

### Top level options object

| Option  | Type                                                 | Description                                                                                                                                                  | Required |
| ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| mdxNodeTypes    | `object`                                             | The keys of this object represent selected GraphQL node types to process as MDX source nodes. Each value is an object with `mdxField`, `mdxFrontmatterField`, `preprocessImages` and `gatsbyImageClassName`. See below for details.          | true    |
| frontmatterSharpRemoteImageUrlArrayField  | `string` | Array of URLs in the frontmatter (same for all MDX types due to technical reasons, creativity and PRs are welcome!) from which to download and process sharp images referencable from MDX, for example to build GatsbyImage nodes from a type, the string will only indicate a top level frontmatter field.                                                                                                | false    |


### mdxNodeTypes object

| Option  | Type                                                 | Description                                                                                                                                                  | Required |
| ------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| mdxField    | `object`                                             | `mdxField` indicates where to find the mdx content string, the results are undefined if also having frontmatter as part of the MDX string.                                                  | true     |
| mdxFrontmatterField    | `object`                                             | The `mdxFrontmatterField` provides the frontmatter JSON object which will be converted to a frontmatter yaml section.                                                  | true     |
| preprocessImages  | `boolean` | Defaults to true, indicating that remote images will be downloaded and processed by sharp. Image tags will be replaced by GatsbyImage                                                                                               | false    |
| gatsbyImageClassName  | `string` | Arbitraty class names to inject into converted Markdown GatsbyImage objects that get created with the preprocessImages directive. Class names will be applied to the outer GatsbyImage component                                                                                               | false    |

The object field separator is `.`, for traversing the object hierarchy applies for `mdxField` and `mdxFrontmatterField` fields. Normal local MDX files are not affected by the plugin, but there needs to be at least one MDX file for the frontmatter fields to be loaded correctly. `frontmatterSharpRemoteImageUrlArrayField` is not traversed with `.` dot notation.

Check the troubleshooting section for more information about the required local MDX files for proper MDX typings.

Example configuration options below:

```javascript
module.exports = {
  plugins: [
    {
      resolve: `@dfrnt/gatsby-mdx-remote`,
      options: {
        mdxNodeTypes: {
          "MyNodeType": {
            // If a hierarchy of objects is to be traversed, use a dot (.) for each level
            mdxField: "statement.markdown",
            mdxFrontmatterField: "frontmatter",
            preprocessImages: true // defaults to true, set to false for <img/> tags for images
          }
        },
        frontmatterSharpRemoteImageUrlArrayField: "imageList",
      }
    }
  ]
}
```

Example source node for the above configuration.

```javascript
const myData = {
  frontmatter: {
    author: "John Doe",
    slug: `blog/blogpost`,
    title: `John Does first blogpost`
  },
  statement: { markdown: `# Hello world\n\nHello world text` }
};
```

Do note that all markdown image nodes `![]()` will be represented as an array in the frontmatter as `imageList`. The produced `Mdx` nodes have a resolver attached as `images` that resolve each downloaded file that get used with the <GatsbyImage/> image replacement.

## When do I use this plugin?

When you are sourcing remote MDX data, you need to get it into the Gatsby cache first. This plugin helps you accomplish creating locally cached MDX data. It replaced the previous functionality offered through `createMDXNode` previously available in `gatsby-plugin-mdx/utils/create-mdx-node`, and other similar solutions before Gatsby 5.

This plugin does not, and should probably not, handle any other tasks such as bringing sharp images and similar functionality. Such things should be handled through plugins in the regular MDX ecosystem.

It could be that frontmatter should optionally be part of the MDX string itself, but is left as an option for the future (or a pull request).

## Example sourceNodes as a reference

Using this example, to be used in `gatsby-node.js`, an MDX File node is created from an arbitrary string. Once created in sourceNodes, it uses the example configuration above, and becomes rendered through the created paged section next.

### `gatsby-node.js` sourceNodes section

If you're not using [@dfrnt/gatsby-source-graphql-nodes](https://www.npmjs.com/package/@dfrnt/gatsby-source-graphql-nodes) to source nodes from a GraphQL endpoint, you can create them programmatically and manually from almost any source that you can get MDX data into your sourceNodes section, using a section like below:

Note that the `frontmatter` data must be located in `data/frontmatter` in the produced node.

If you need to create nodes from other content nodes, you should be able to create onwards nodes using the Gatsby `onCreateNode` API. A documentation PR for this could probably be helful for the community.

For the example below, don't forget to add GatsbyImage to your trusted MDX components!

```javascript
exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions
    // Data can come from anywhere, and let's create an MDX node programmatically from some data
  const frontmatter = {
    author: "John Doe",
    slug: `blog/blogpost`,
    title: `John Doe's first blogpost`,
    imageList: ["https://images.unsplash.com/photo-1522262139463-236991a708cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80"]
  }

  const content = {
    mdx: `# Hello world\n\nHello world text\n\n<GatsbyImage alt="test 0" image={getImage(props.pageContext.imageList[0]?.childImageSharp?.gatsbyImageData)}/>\n\n![Sign you've been looking for](https://images.unsplash.com/photo-1496449903678-68ddcb189a24?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80)`,
    id: `my-data-${12345}`,
  }
  const gatsbyMdxContent = {
    frontmatter,
    statement: { markdown: content.mdx }
  };
  const nodeContent = JSON.stringify(gatsbyMdxContent)

  const gatsbyNodeMeta = {
    id: createNodeId(content.id),
    parent: null,
    children: [],
    internal: {
      type: `MyNodeType`,
      mediaType: `text/markdown`,
      content: nodeContent,
      contentDigest: createContentDigest(gatsbyMdxContent)
    }
  }

  const node = Object.assign({}, { data: gatsbyMdxContent }, gatsbyNodeMeta)

  createNode(node)
}

```

### `gatsby-node.js` createPages section

In below createPages example we use `getNode()` to resolve the node. The reason is that there is some interoperability issue, where at least one local mdx node is required for the GraphQL types to be properly created. Using createPages like below is a workaround for that issue.

Therefore the suggestion to create at least one real local MDX file, any page really, so that the GraphQL configuration is updated for Mdx nodes. If so, a regular GraphQL query can be used.

Out of your original node, "MyNodeType", an "mdxMyNodeType" will be created that contains the `childMdx` node pointing to the Mdx node.

```javascript
exports.createPages = async ({ graphql, actions, reporter, getNode }) => {
  const { createPage, createNode } = actions;
  const result= await graphql(`
    query {
      allMyNodeType {
        nodes {
          childMdx {
            id
            markdownImageList {
              childImageSharp {
                gatsbyImageData
              }
            }
            imageList {
              childImageSharp {
                gatsbyImageData
              }
            }
            internal {
              contentFilePath
            }
          }
        }
      }
    }
  `);

  result.data.allMyNodeType.nodes.map(node => node.childMdx).forEach(node => {
    // If for some reason, the fields are not showing up in GraphQL, this is a workaround...
    // happened initially, seems to work normally now though, but could help someone maybe.
    const mdxNode = getNode(node.id);
    createPage({
      path: `/${(mdxNode?.frontmatter).slug}`,
      // When querying for MDX nodes directly and using a template
      //   component: path.resolve(`./src/layouts/page.jsx?__contentFilePath=${mdxNode?.internal.contentFilePath}`),
      // If using the original rich content node, iterate the childMdx instead in the forEach above
      // Using the MDX node directly
      component: mdxNode?.internal.contentFilePath,
      ownerNodeId: `dfrnt-graphql`,
      // The context is passed as props to the component as well
      // as into the component's GraphQL query.
      context: {
        ...mdxNode,
      },
    });
  });
};
```

## Troubleshooting

### Must have at least one local MDX file for the plugin to work

There is likely some kind of bug if there are no .MDX files in the local filesystem. What happens is that MDX definitions will not be created if a local `.mdx` file is not present.

### How to reference remote frontmatter imageList images

Example GatsbyImage MDX component for referencing an imageList image when        `frontmatterSharpRemoteImageUrlArrayField` has been set to `imageList`:

```markdown
<GatsbyImage alt="test 0" image={getImage(props.pageContext.imageList[0]?.childImageSharp?.gatsbyImageData)}/>
```

Note that the original URL stays in the frontmatter verbatim, and a section is added onto the MDX node with the transformed field name (under the same name as in the frontmatter field).

The transformed markdown images will instead be available in the markdownImageList frontmatter and node fields respectively.

### Add the relevant fields to you page query so they can be used in the MDX

The fields that are referenced to render the images (if preprocessing with sharp) must be available in the `pageContext` (`props.pageContext.images.childImageSharp.gatsbyImageData`), you will likely also need the `frontmatter.imageList`.

```graphql
  query {
    allMdx {
      nodes {
        id
        imageList {
          childImageSharp {
            gatsbyImageData
          }
        }
        markdownImageList {
          childImageSharp {
            gatsbyImageData
          }
        }
        internal {
          contentFilePath
        }
        frontmatter {
          slug
          imageList
          title
        }
      }
    }
  }
```

### Can't find imageList (and markdownImageList) in frontmatter

There seems to be a bug in remote MDX processing in that a local MDX file must exist with the target MDX frontmatter type configuration. Otherwise the schema will not be created correctly.

Create an MDX file that looks like this in a location where MDX files are loaded:

```markdown
---
slug: no/content
title: Empty file
imageList:
- https://upload.wikimedia.org/wikipedia/en/a/a9/Example.jpg
---

No content
```

This will ensure that MDX files have `slug`, `title` and `imageList` properties. If the `imageList` array does not exist for the frontmatter, the remote image preprocessing will not work. 

Make sure to always query for markdownImageList if you have images in your MDX file and preprocess images!

### In general

The MDX relies on a correct cache. Many things are helped by starting over with the cache, using `gatsby clean`. Depending on your situation, it can be helpful to try!

## How to develop locally

```shell
git clone https://github.com/dfrnt-com/gatsby-mdx-remote
npm install
```

It is suggested to run `npm link` in the directory, and then run `npm link @dfrnt/gatsby-mdx-remote` in the `example-site` used for development.

## Opportunities to contribute (suggestions for PRs)

* Make `frontmatterSharpRemoteImageUrlArrayField` applicable per type
* Make `frontmatterSharpRemoteImageUrlArrayField` traversable maybe?
* Add `onCreateNode` documentation for producing one node from another for ingestion.

## How to contribute

If you have unanswered questions, would like help with enhancing or debugging the plugin, add issues and pull requests to [dfrnt-com/gatsby-mdx-remote](https://github.com/dfrnt-com/gatsby-mdx-remote).

This is a project offered as-is to the community under the MIT license. Contributions are more than welcome! Please visit the [DFRNT data product builder](https://dfrnt.com) to learn more about building websites from knowledge graphs using data products with strong data models in TerminusDB data products.

