import { types as tt } from "../tokenizer/types";
import { types as ct } from "../tokenizer/context";
import Parser from "../parser";
import "./flow";

const pp = Parser.prototype;

export default function (instance) {
  instance.extend("parseStatement", function (inner) {
    return function (declaration, topLevel) {
      const lookahead = this.lookahead();

      if (this.match(tt.name) && lookahead.type === tt.doubleColon) {
        const declarationNode = this.startNode();
        const identifierNode = this.parseIdentifier();
        this.expect(tt.doubleColon);
        return this.dctypesParseTypeDefinition(declarationNode, identifierNode);
      } else {
        return inner.call(this, declaration, topLevel);
      }
    };
  });

  // Slightly hacky solution to parse type declarations in class body:
  // Make isClassProperty() return true on them, patch parseClassProperty()

  instance.extend("isClassProperty", function (inner) {
    return function () {
      return inner.call(this) || this.match(tt.doubleColon);
    };
  });

  instance.extend("parseClassProperty", function (inner) {
    return function (node) {
      if (this.match(tt.doubleColon)) {
        const identifierNode = node.key;
        delete node.key;
        this.expect(tt.doubleColon);
        return this.dctypesParseTypeDefinition(node, identifierNode);
      } else {
        return inner.call(this, node);
      }
    };
  });
}

pp.dctypesParseTypeDefinition = function dctypesParseTypeDefinition (declarationNode, identifierNode) {
  declarationNode.id = identifierNode;
  declarationNode.typeAnnotation = this.flowParseType();

  this.semicolon();

  return this.finishNode(declarationNode, "TypeDeclaration");
};
