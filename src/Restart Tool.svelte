<script>
    import Restart from '$lib/images/Restart.webp';
    import { PROMPT_START_OVER } from './const';
    import { isGameOn } from './shared.svelte';
    import { _sound } from './sound.svelte';
    import { _prompt, ss } from './state.svelte';
    import ToolButton from './Tool Button.svelte';

    const onClick = () => {
        if (_prompt.id == PROMPT_START_OVER) {
            _prompt.opacity = 0;
            return;
        }

        delete ss.help;

        _sound.play('plop');
        _prompt.set(PROMPT_START_OVER);
    };
</script>

<div class="restart-tool">
    <ToolButton src={Restart} width={45} {onClick} disabled={!isGameOn()} />
</div>

<style>
    .restart-tool {
        place-self: end start;
        display: grid;
        z-index: 2;
        clip-path: circle(50%);
        /* background: #fff; */
    }
</style>
