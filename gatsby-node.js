const {createMdxNode} = require("./src/createMdxNode");
/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

exports.onPreInit = () => console.log("Loaded gatsby-transform-remote-mdx")

exports.createResolvers = ({
  actions,
  cache,
  createNodeId,
  createResolvers,
  store,
  reporter,
}) => {
  const { createNode } = actions;
  const resolvers = {
    Mdx: {
      images: {
        type: `[File]`,
        resolve: async (source, args, context, info) => {
          reporter.info(
            `Adding resolver for image: ${source.frontmatter.imageList}`
          )
          return source.frontmatter.imageList ? source.frontmatter.imageList.map(url => createRemoteFileNode({
            url: url,
            createNode,
            createNodeId,
            reporter,
            cache,
            store,
          })) : [];
        },

      }
    },
  };
  createResolvers(resolvers);
};


exports.onCreateNode = (sourceArgs, options) => {
  const { node } = sourceArgs;

  const configuredMdxNodeTypes = options.mdxNodeTypes && Object.keys(options.mdxNodeTypes);
  if(configuredMdxNodeTypes && configuredMdxNodeTypes.indexOf(node.internal.type) !== -1) {
    createMdxNode(node, options.mdxNodeTypes[node.internal.type], sourceArgs);
  }
}
