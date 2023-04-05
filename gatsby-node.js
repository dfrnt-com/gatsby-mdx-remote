const {createMdxNode} = require("./src/createMdxNode");
/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

exports.onPreInit = () => console.log("Loaded gatsby-transform-remote-mdx")

exports.onCreateNode = (sourceArgs, options) => {
  const { node } = sourceArgs;

  const configuredMdxNodeTypes = options.mdxNodeTypes && Object.keys(options.mdxNodeTypes);
  if(configuredMdxNodeTypes && configuredMdxNodeTypes.indexOf(node.internal.type) !== -1) {
    createMdxNode(node, options.mdxNodeTypes[node.internal.type], sourceArgs);
  }
}
