
const { createFileNodeFromBuffer } = require("gatsby-source-filesystem");
const YAML = require("YAML");

const recurseFieldContent = (nodeData, objectFieldSequence) => {
  if (objectFieldSequence.length === 0 || !nodeData) {
    return nodeData;
  } else {
    const fieldName = objectFieldSequence[0];
    if (Array.isArray(nodeData)) {
      return recurseFieldContent(nodeData[0], objectFieldSequence);
    } else if (!Array.isArray(nodeData) && typeof nodeData === "object") {
      const fields = objectFieldSequence.slice(1);
      const childNodeData = (nodeData)[fieldName];
      return recurseFieldContent(childNodeData, fields);
    } else {
      return undefined;
    }
  }
};

const createMdxNode = async (
  nodeData,
  typeConfig,
  args
) => {
  const { actions, createNodeId, getCache } = args;
  const { createNode } = actions;

  const frontmatterField = typeConfig.mdxFrontmatterField;
  const frontmatterFields =
    (frontmatterField && (frontmatterField.indexOf(".") !== -1 ? frontmatterField.split(".") : [frontmatterField])) || undefined;
  const frontmatterFieldData = frontmatterFields && recurseFieldContent(nodeData, frontmatterFields);
  const frontmatter = frontmatterFieldData && `---\n${YAML.stringify(frontmatterFieldData)}---\n`;

  const mdxField = typeConfig.mdxField;
  const mdxFields = mdxField ? mdxField.split(".") : undefined;
  const mdxFieldData = mdxFields && `\n${recurseFieldContent(nodeData, mdxFields) ?? ""}`;

  const mdxContentWithFrontmatter = `${frontmatter}${mdxFieldData}`;

  if (mdxContentWithFrontmatter) {
    return createFileNodeFromBuffer({
      buffer: Buffer.from(mdxContentWithFrontmatter),
      ext: ".mdx",
      parentNodeId: nodeData.id,
      getCache: getCache,
      createNode: createNode,
      createNodeId: createNodeId,
    });
  }
};

module.exports = { createMdxNode };