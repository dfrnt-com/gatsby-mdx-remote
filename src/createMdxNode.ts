import { createFileNodeFromBuffer } from "gatsby-source-filesystem";
import YAML from "YAML";
import remark from "remark";
import visit from "unist-util-visit";
import { Node as UnistNode } from "unist";
import type { Node, CreateNodeArgs } from "gatsby";
import { PluginTypeOptions } from "./gatsby-node";

type IntermediateNodeData = NodeDataObject | string;
interface NodeDataObject {
  [key: string]: string | NodeDataObject;
}

const recurseFieldContent = (
  nodeData: IntermediateNodeData,
  objectFieldSequence: Array<string>
): NodeDataObject | string | undefined => {
  if (objectFieldSequence.length === 0 || !nodeData) {
    return nodeData;
  } else {
    const fieldName = objectFieldSequence[0];
    if (Array.isArray(nodeData)) {
      return recurseFieldContent(nodeData[0], objectFieldSequence);
    } else if (!Array.isArray(nodeData) && typeof nodeData === "object") {
      const fields = objectFieldSequence.slice(1);
      const childNodeData = nodeData[fieldName];
      return recurseFieldContent(childNodeData, fields);
    } else {
      return undefined;
    }
  }
};

interface CachedMdxImagesFunctions {
  pushImageUrlList: (value: string) => void;
}

interface ImageNodeData extends UnistNode {
  url?: string;
  alt?: string;
  title?: string;
  children?: UnistNode;
  value?: string;
}
const cacheMdxImages = async ({ pushImageUrlList }: CachedMdxImagesFunctions, content: string): Promise<string> => {
  var tree = remark().parse(content);

  const urlList: Array<string> = [];

  function visitor(node: ImageNodeData): void {
    if (node.url) {
      const index = urlList.length;
      urlList.push(node.url);

      const html = `<GatsbyImage alt="${node.alt}" title="${node.title}" image={getImage(props.pageContext.images[${index}]?.childImageSharp?.gatsbyImageData)} />\n`;
      node.type = "html";
      node.children = undefined;
      node.value = html;
    }
  }

  visit(tree, "image", visitor);

  const mdx = remark.stringify(tree);
  urlList.forEach((url) => pushImageUrlList(url));
  return mdx;
};

export const createMdxNode = async (
  nodeData: Node & Record<string, any>,
  typeConfig: PluginTypeOptions,
  args: CreateNodeArgs<Record<string, unknown>>
) => {
  const { actions, createNodeId, getCache } = args;
  const { createNode } = actions;
  const preprocessImages = typeConfig.preprocessImages === undefined || typeConfig.preprocessImages;

  const mdxField = typeConfig.mdxField;
  const mdxFields = mdxField ? mdxField.split(".") : undefined;
  const mdxFieldData = mdxFields && `\n${recurseFieldContent(nodeData, mdxFields) ?? ""}`;

  const urlList: Array<string> = [];

  const mdxProcessedFieldData =
    preprocessImages && mdxFieldData
      ? await cacheMdxImages(
          {
            pushImageUrlList: (value) => urlList.push(value),
          },
          mdxFieldData
        )
      : mdxFieldData;

  const frontmatterField = typeConfig.mdxFrontmatterField;
  const frontmatterFields =
    (frontmatterField && (frontmatterField.indexOf(".") !== -1 ? frontmatterField.split(".") : [frontmatterField])) || undefined;
  const recursedFrontmatterFieldData = frontmatterFields && recurseFieldContent(nodeData, frontmatterFields);
  const frontmatterFieldData =
    (recursedFrontmatterFieldData && typeof recursedFrontmatterFieldData !== "string" && recursedFrontmatterFieldData) || undefined;
  const frontmatter = frontmatterFieldData && `---\n${YAML.stringify({ ...frontmatterFieldData, imageList: urlList })}---\n`;

  const gatsbyImageImport =
    preprocessImages &&
    mdxProcessedFieldData &&
    mdxProcessedFieldData.indexOf("import { GatsbyImage, getImage") === -1 &&
    mdxProcessedFieldData.indexOf("import { getImage, GatsbyImage") === -1
      ? 'import { GatsbyImage, getImage } from "gatsby-plugin-image"'
      : "";

  const mdxContentWithFrontmatter = `${
    (typeConfig.mdxFrontmatterField && frontmatter) || undefined
  }\n\n${gatsbyImageImport}\n\n${mdxProcessedFieldData}`;

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
