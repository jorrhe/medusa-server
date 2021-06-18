import mongoose from 'mongoose';

const Eliminado = new mongoose.Schema ({
    id_google: {
        type: String,
        required: true
    },
    resets: {
        type: Number,
        default: 0
    },
});

export default mongoose.model('Eliminado', Eliminado);