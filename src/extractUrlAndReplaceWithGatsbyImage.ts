import visit from "unist-util-visit";
import { Node as UnistNode } from "unist";

export interface ReplaceImageDataOptions {
  pushImageUrlToList: (value: string) => void;
  getUrlListLength: () => number;
  className?: string;
}

interface ImageNodeData extends UnistNode {
  url?: string;
  alt?: string;
  title?: string;
  children?: UnistNode | any;
  value?: string;
  attributes?: any;
  name?: string;
  depth?: number;
}

export const extractUrlAndReplaceWithGatsbyImage =
  (options: ReplaceImageDataOptions) =>
  (tree: UnistNode): void => {
    // We visit only 'image' nodes
    visit(tree, "mdxJsxFlowElement", (node: ImageNodeData) => {
      console.log(JSON.stringify(node, null, 2));
    });

    visit(tree, "image", (node: ImageNodeData) => {
      if (node.depth === undefined && node.url) {
        const index = options.getUrlListLength();
        options.pushImageUrlToList(node.url);
        const providedClassName = options.className ? `className="${options.className}"` : "";
        const html = `<GatsbyImage alt="${node.alt}" title="${node.title??node.alt}" image={getImage(props.pageContext.markdownImageList[${index}]?.childImageSharp?.gatsbyImageData)} ${providedClassName} />\n`;
        node.type = "html";
        node.name = "GatsbyImage";
        node.children = undefined;
        node.value = html;
      } else {
        return;
      }
    });
  };
