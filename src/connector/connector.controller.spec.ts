import { Test, TestingModule } from '@nestjs/testing';
import { ConnectorController } from './connector.controller';

describe('ConnectorController', () => {
  let controller: ConnectorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectorController],
    }).compile();

    controller = module.get<ConnectorController>(ConnectorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
