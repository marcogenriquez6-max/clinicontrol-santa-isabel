export class AttachmentDomain {
  constructor(
    public readonly id?: string,
    public entityType?: string,
    public entityId?: string,
    public filename?: string,
    public originalName?: string,
    public mimeType?: string,
    public size?: number,
    public path?: string,
    public thumbnailPath?: string | null,
    public uploadedBy?: string,
    public createdAt?: Date,
    public deletedAt?: Date,
  ) {}
}
