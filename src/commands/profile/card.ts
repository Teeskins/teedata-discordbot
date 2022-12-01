import {
  ApplicationCommandOption,
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  CommandInteractionOption,
  Message
} from 'discord.js';

import { v4 as uuidv4 } from 'uuid';

import { Bot } from '../../bot';
import ICommand from '../../interfaces/command';
import { personalCardParams } from '../../services/apis/twutils';
import parseCommandOptions from '../../utils/commandOptions';
import sendDiscordRawImage from '../../utils/discordSendImage';
import ErrorEmbed from '../../utils/msg';

const NONE_FIELD = '-';
const BACKGROUNDS_DIR = './data/scenes/backgrounds/';

// Cards
import { TwPersonalCard } from '../../services/cards/personal';

export default class implements ICommand {
  name: string;
  category: string;
  description: string;
  options: ApplicationCommandOption[];
    
  constructor() {
    this.name = 'card';
    this.category = 'profile';
    this.description = 'Visualize your Teedata profile public informations or generate custom data';
    this.options = [
      // {
      //   name: 'essential',
      //   description: 'Only show the essential informations',
      //   type: ApplicationCommandOptionType.Subcommand,
      //   options: [
      //     {
      //       name: 'name',
      //       type: ApplicationCommandOptionType.String,
      //       required: true,
      //       description: 'Website username',
      //     }
      //   ]
      // },
      // {
      //   name: 'full',
      //   description: 'Show all your information',
      //   type: ApplicationCommandOptionType.Subcommand,
      //   options: [
      //     {
      //       name: 'name',
      //       type: ApplicationCommandOptionType.String,
      //       required: true,
      //       description: 'Website username',
      //     }
      //   ]
      // },
      {
        name: 'personal',
        description: 'Generate a custom card with your Teeworlds informations',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'username',
            type: ApplicationCommandOptionType.String,
            required: false,
            description: 'Teeworlds username',
          },
          {
            name: 'clan',
            type: ApplicationCommandOptionType.String,
            required: false,
            description: 'Teeworlds clan(s)',
          },
          {
            name: 'since',
            type: ApplicationCommandOptionType.String,
            required: false,
            description: 'Teeworlds year since you play',
          },
          {
            name: 'gamemode',
            type: ApplicationCommandOptionType.String,
            required: false,
            description: 'Teeworlds gamemode(s)',
          },
          {
            name: 'description',
            type: ApplicationCommandOptionType.String,
            required: false,
            description: 'The description you want',
          }
        ]
      },
    ];
  }

  private async essentialCardCommand(
    interaction: CommandInteraction<CacheType>,
    _name: string
  ) {
    await interaction.followUp({
      content: 'essential'
    });
  }

  private async fullCardCommand(
    interaction: CommandInteraction<CacheType>,
    _name: string
  ) {
    await interaction.followUp({
      content: 'full'
    });
  }

  private async personalCardCommand(
    interaction: CommandInteraction<CacheType>,
    data: personalCardParams
  ) {
    const path = uuidv4() + '.png';
    const card = new TwPersonalCard()
      .setUsername(data.username || NONE_FIELD)
      .setClan(data.clan || NONE_FIELD)
      .setGamemode(data.gamemode || NONE_FIELD)
      .setSince(data.since || NONE_FIELD)
      .setDescription(data.description || NONE_FIELD);

    try {
      await card.setRandomBackground(BACKGROUNDS_DIR);
      await card.process();
      card.save('.', path);

    } catch (err) {
      await interaction.followUp({
        embeds: [ ErrorEmbed.wrong() ]
      });
    
      return;
    }

    await sendDiscordRawImage(
      interaction,
      {
        title: 'Personal card',
        raw: card.canvas.toBuffer(),
        path
      }
    );
  }

  async run(
    _bot: Bot,
    message: Message<boolean> | CommandInteraction<CacheType>,
    args: Array<CommandInteractionOption>
  ) {
    const [ subCommand ] = args;
    const options = parseCommandOptions(subCommand);

    const interaction = message as CommandInteraction<CacheType>;

    await interaction.deferReply({ ephemeral: true });

    switch (subCommand.name) {
      case 'essential':
        await this.essentialCardCommand(interaction, options.name);
        break;

      case 'full':
        await this.fullCardCommand(interaction, options.name);
        break;

      case 'personal':
        await this.personalCardCommand(
          interaction,
          {
            username: options.username,
            clan: options.clan,
            since: options.since,
            gamemode: options.gamemode,
            description: options.description,
          }
        );
        break;

      default:
        break;
    }
  }
}
    