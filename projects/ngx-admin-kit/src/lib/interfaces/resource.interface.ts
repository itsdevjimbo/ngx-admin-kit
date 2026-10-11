import { IField } from "./field.interface";

export interface IResource {
  id: string;
  title: string;
  route: string;
  apiEndpoint: string;
  form: () => IField[]
}
