<p align="center">
  <a href="https://www.gatsbyjs.com">
    <img alt="Gatsby" src="https://www.gatsbyjs.com/Gatsby-Monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  Plugin for creating MDX from remote content
</h1>

This is a minimal transformation plugin that takes sourced nodes and builds MDX File nodes out of them, with configurable node locations for the mdx field to use, and where to source the frontmatter.

Multiple source node type are supported with individual configurations.

Developed to be used for building MDX-based static websites out of TerminusDB data products hosted at [DFRNT.com](https://dfrnt.com?utm_source=gatsby), accessed via GraphQL.

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

## Example sourceNodes as a reference

Using this example, to be used in `gatsby-node.js`, an MDX File node is created from an arbitrary string. Once created in sourceNodes, it uses the example configuration above, and becomes rendered through the created paged section next.

### `gatsby-node.js` sourceNodes section

```javascript
exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions

  // Data can come from anywhere, but for now create it manually
  const frontmatter = {
    author: "John Doe",
    slug: `blog/blogpost`,
    title: `John Does first blogpost`
  }

  const mdx = `# Hello world\n\nHello world text`
  const myData = {
    frontmatter,
    statement: { markdown: mdx }
  };
  const nodeContent = JSON.stringify(myData)

  const nodeMeta = {
    id: createNodeId(`local-data-${12345}`),
    parent: null,
    children: [],
    internal: {
      type: `MyNodeType`,
      mediaType: `text/html`,
      content: nodeContent,
      contentDigest: createContentDigest(myData)
    }
  }

  const node = Object.assign({}, myData, nodeMeta)
  createNode(node)
}

```

### `gatsby-node.js` createPages section

In below createPages example we use `getNode()` to resolve the node. The reason is that there is some interoperability issue, where at least one local mdx node is required for the GraphQL types to be properly created. Using createPages like below is a workaround for that issue.

Therefore the suggestion to create at least one real local MDX file, any page really, so that the GraphQL configuration is updated for Mdx nodes. If so, a regular GraphQL query can be used.

```javascript
exports.createPages = async ({ graphql, actions, reporter, getNode }) => {
  const { createPage, createNode } = actions;
  const result= await graphql(`
    query {
      allMdx {
        nodes {
          id
          parent {
            id
          }
        }
      }
    }
  `);

  result.data.allMdx.nodes.forEach((node) => {
    // For some reason, the fields are not showing up in GraphQL...
    const mdxNode = getNode(node.id);
    createPage({
      path: `/${(mdxNode?.frontmatter).slug}`,
      // component: path.resolve(`./src/layouts/page.jsx?__contentFilePath=${mdxNode?.internal.contentFilePath}`),
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