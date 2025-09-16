import type { Request, RequestHandler, Response } from "express";

import { fileService } from "@/api/file/fileService";
import type { GetDataParams } from "@/types/csv.types";

class FileController {
  public getFiles: RequestHandler = async (_req: Request, res: Response) => {
    // const serviceResponse = await fileService.findAll();
    // res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public upload: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.upload(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getFile = async (_req: Request<GetDataParams>, res: Response) => {
    const serviceResponse = await fileService.getFile(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getData = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.getData(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public update = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.update(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
  public validate = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.validate(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public validationStats = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.validationStats(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public validationStatus = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.validationStatus(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public exportSingle = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.exportSingle(_req, res);
    // res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public exportAll = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.exportAll(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public exportBatch = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.exportBatch(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public exportMetadata = async (_req: Request, res: Response) => {
    const serviceResponse = await fileService.exportBatch(_req, res);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const fileController = new FileController();
