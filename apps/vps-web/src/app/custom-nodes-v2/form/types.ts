// Core types that match our schema
export interface FormSchema {
  app: {
    title: string;
    pages: Page[];
    dataSources?: DataSource[];
  };
}

export interface Page {
  id: string;
  title: string;
  route: string;
  layout?: "grid" | "flex" | "vertical" | "horizontal";
  components: Component[];
  isEndPage?: boolean;
}

export interface Component {
  type:
    | "text"
    | "input"
    | "textarea"
    | "checkbox"
    | "radio"
    | "select"
    | "button"
    | "table"
    | "form"
    | "section"
    | "array";
  id: string;
  label?: string;
  props?: Record<string, any>;
  children?: Component[];
  bindings?: {
    dataSource?: string;
    field?: string;
    onChange?: string;
  };
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
  };
  visibilityConditions?: VisibilityCondition[];
  eventHandlers?: EventHandlers;
  arrayItems?: ArrayItem[];
}

export interface VisibilityCondition {
  field: string;
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
  value: any;
}

export interface EventHandlers {
  onClick?: Action;
  onSubmit?: Action;
  onChange?: Action;
}

export interface Action {
  type: "navigate" | "submit" | "apiRequest" | "showMessage";
  params?: Record<string, any>;
  dataSource?: string;
  targetPage?: string;
  message?: string;
  branches?: Branch[];
}

export interface DataSource {
  id: string;
  type: "rest" | "graphql";
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: string;
  params?: Record<string, any>;
  responseMapping?: Record<string, any>;
}

export interface Branch {
  condition: {
    field: string;
    operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
    value: string;
  };
  nextPage: string;
}

export interface ArrayItem {
  id: string;
  components: Component[];
}
