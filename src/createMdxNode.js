
const { createFileNodeFromBuffer, createRemoteFileNode, createFilePath } = require("gatsby-source-filesystem");
const YAML = require("YAML");
const remark = require("remark")
const visit = require("unist-util-visit")

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

const cacheMdxImages = async ({ pushImageUrlList }, content) => {
  var tree = remark().parse(content)
  const urlList = []

  function visitor(node) {
    if (node.url) {
      const index = urlList.length;
      urlList.push(node.url)

      const html = `<GatsbyImage alt="${node.alt}" title="${node.title}" image={getImage(props.pageContext.images[${index}]?.childImageSharp?.gatsbyImageData)} />\n`;
      node.type = "html";
      node.children = undefined;
      node.value = html;
    }
  }

  visit(tree, "image", visitor)

  const mdx = remark.stringify(tree);
  urlList.forEach(url => pushImageUrlList(url))
  return mdx
}

const createMdxNode = async (
  nodeData,
  typeConfig,
  args
) => {
  const { actions, createNodeId, getCache } = args;
  const { createNode } = actions;
  const preprocessImages = typeConfig.preprocessImages === undefined || typeConfig.preprocessImages;

  const mdxField = typeConfig.mdxField;
  const mdxFields = mdxField ? mdxField.split(".") : undefined;
  const mdxFieldData = mdxFields && `\n${recurseFieldContent(nodeData, mdxFields) ?? ""}`;

  const urlList = []

  const mdxProcessedFieldData = preprocessImages ? await cacheMdxImages({
    createNode,
    createNodeId,
    parentNodeId: nodeData.id,
    getCache,
    pushImageUrlList: (value) => urlList.push(value)
  }, mdxFieldData) : mdxFieldData;

  const frontmatterField = typeConfig.mdxFrontmatterField;
  const frontmatterFields =
    (frontmatterField && (frontmatterField.indexOf(".") !== -1 ? frontmatterField.split(".") : [frontmatterField])) || undefined;
  const frontmatterFieldData = frontmatterFields && recurseFieldContent(nodeData, frontmatterFields);
  const frontmatter = frontmatterFieldData && `---\n${YAML.stringify({...frontmatterFieldData, imageList: urlList})}---\n`;

  const gatsbyImageImport = preprocessImages && (mdxProcessedFieldData.indexOf("import { GatsbyImage, getImage") === -1 && mdxProcessedFieldData.indexOf("import { getImage, GatsbyImage") === -1) ? "import { GatsbyImage, getImage } from \"gatsby-plugin-image\"" : "";
  const mdxContentWithFrontmatter = `${typeConfig.mdxFrontmatterField && frontmatter}\n\n${gatsbyImageImport}\n\n${mdxProcessedFieldData}`;

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