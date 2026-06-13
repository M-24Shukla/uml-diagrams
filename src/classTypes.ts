export type ClassMemberKind = 'field' | 'method';

export type ClassMember = {
  id: string;
  value: string;
};

export type ClassStereotype =
  | 'class'
  | 'abstract'
  | 'interface'
  | 'service'
  | 'enumeration';

export type ClassEntity = {
  id: string;
  name: string;
  stereotype: ClassStereotype;
  fields: ClassMember[];
  methods: ClassMember[];
};

export type ClassRelationshipKind =
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'association'
  | 'link'
  | 'dependency'
  | 'realization'
  | 'dottedLink';

export type ClassRelationship = {
  id: string;
  from: string;
  to: string;
  kind: ClassRelationshipKind;
  label: string;
};

export type ClassDiagramModel = {
  classes: ClassEntity[];
  relationships: ClassRelationship[];
};
